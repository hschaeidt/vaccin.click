// Ce script affiche les boutons dans les résultats de la recherche
// permettant de sélectionner les centres dans lesquels prendre RDV automatiquement
(async function () {
  const $locations = document.getElementById("locations");
  const $template = document.getElementById("location");
  const $debugActivity = document.getElementById("debugActivity");

  //const appStatus = new AppStatus();
  const localStorage = new LocalStorageReader({
    onLogsChanged: displayLogs,
    onLocationsChanged: (localLocations) => {
      displayLocations(locations, localLocations);
    },
  });

  function displayLogs(logLines) {
    $debugActivity.innerHTML = "";

    logLines.forEach((log) => {
      const $li = document.createElement("li");
      $li.innerText = log;
      $debugActivity.appendChild($li);
      $debugActivity.scrollTop = $debugActivity.scrollHeight;
    });
  }

  function displayLocations(locations, localLocations) {
    $locations.innerHTML = "";

    locations = locations || {};
    localLocations = localLocations || {};

    Object.entries(locations).forEach(([url, { name, img }]) => {
      const localLocation = localLocations[url] || {};

      const $location = $template.content.cloneNode(true);
      const $item = $location.querySelector(".panel-list-item");
      const $a = $location.querySelector("a");
      $a.innerText = name;
      $a.href = url;

      $location.querySelector(".date").innerText = localLocation.date
        ? new Date(localLocation.date).toLocaleTimeString()
        : "";

      if (localLocation.status)
        $item.classList.add("status-" + localLocation.status);
      $location.querySelector("img").src = img;
      $location.querySelector("button").onclick = async () => {
        if (
          !confirm(`Êtes-vous sur de vouloir retirer "${name}" de la liste ?`)
        )
          return;

        const { locations } = await browser.storage.sync.get({
          locations: {},
        });
        delete locations[url];

        await browser.storage.sync.set({ locations });
      };

      $locations.appendChild($location);
    });
  }

  function displayStopStart(stopped) {
    document.getElementById(stopped ? "start" : "stop").style =
      "display: block";
    document.getElementById(stopped ? "stop" : "start").style = "display: none";
  }

  let { locations, stopped, autoBook } = await browser.storage.sync.get({
    locations: {},
    autoBook: false,
    stopped: false,
  });

  await localStorage.init();

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName === "sync") {
      if (change.locations) {
        locations = change.locations.newValue;
        displayLocations(locations, localStorage.getLocations());
      }

      if (change.stopped) displayStopStart(change.stopped.newValue || false);

      if (change.autoBook)
        document.getElementById(
          change.autoBook.newValue || false
            ? "enableAutoBook"
            : "disableAutoBook"
        ).checked = true;
    }
  });

  document.getElementById("stop").onclick = async () => {
    await browser.storage.sync.set({ stopped: true });
    displayStopStart(true);
  };

  document.getElementById("start").onclick = async () => {
    await browser.storage.sync.set({ stopped: false });
    displayStopStart(false);
  };

  document.getElementById("reset").onclick = async () => {
    if (
      !confirm(
        "Êtes-vous sur de vouloir supprimer toutes les données de l'extension ?"
      )
    )
      return;

    await browser.storage.sync.clear();
  };

  document.getElementById("disableAutoBook").onclick = async () =>
    await browser.storage.sync.set({ autoBook: false });
  document.getElementById("enableAutoBook").onclick = async () =>
    await browser.storage.sync.set({ autoBook: true });

  displayStopStart(stopped);

  document.getElementById(
    autoBook ? "enableAutoBook" : "disableAutoBook"
  ).checked = true;

  displayLocations(locations, localStorage.getLocations());
})();
