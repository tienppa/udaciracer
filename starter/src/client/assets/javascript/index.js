// The store will hold all information needed globally
let store = {
  track_id: undefined,
  track_name: undefined,
  player_id: undefined,
  player_name: undefined,
  race_id: undefined,
};

// Constants for race states
const IN_PROGRESS = "in-progress";
const FINISHED = "finished";
const UN_STARTED = "unstarted";

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

// Function to load tracks and racers on page load
async function onPageLoad() {
  console.log("Getting form info for dropdowns!");
  try {
    // Fetch tracks and render them
    getTracks().then((tracks) => {
      renderAt("#tracks", renderTrackCards(tracks));
    });

    // Fetch racers and render them
    getRacers().then((racers) => {
      renderAt("#racers", renderRacerCars(racers));
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

// Function to set up event listeners for user interactions
function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;

      // Race track form field
      if (
        target.matches(".card.track") ||
        target.parentNode.matches(".card.track")
      ) {
        handleSelectTrack(target);
        store.track_id = target.id;
        store.track_name = target.innerHTML;
      }

      // Racer form field
      if (target.matches(".button.racer")) {
        event.preventDefault();

        handleSelectRacer(target);
        store.player_id = target.id;
        store.player_name = target.dataset.name;
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate();
      }

      console.log("Store updated :: ", store);
    },
    false
  );
}

// Function to simulate a delay (used in countdown)
async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}

// Function to handle creating a new race
async function handleCreateRace() {
  // Get player_id and track_id from the store
  const { player_id, track_id } = store;

  // Validate data
  if (!player_id || !track_id) {
    showToastMessage(
      "Please select racer and track to start the race!",
      "toast--error"
    );
    return;
  }

  try {
    const race = await createRace(player_id, track_id);
    // update the store with the race id
    store.race_id = race.ID;
    // render starting UI
    renderAt("#race", renderRaceStartView(track_id));
    // call function runCountdown
    await runCountdown();
    // call function startRace
    await startRace(store.race_id);
    // call function runRace
    await runRace(store.race_id);
  } catch (error) {
    console.log("Problem with handleCreateRace: ", error.message);
  }
}

// Function to continuously fetch race updates and update the UI
function runRace(raceID) {
  return new Promise((resolve) => {
    // Javascript's built in setInterval method to get race info every 500ms
    const raceInterval = setInterval(async () => {
      try {
        const raceStatus = await getRace(raceID);
        if (raceStatus.status === IN_PROGRESS) {
          renderAt("#leaderBoard", raceProgress(raceStatus.positions)); // to render the process view
        } else if (raceStatus.status === FINISHED) {
          clearInterval(raceInterval); // to stop the interval from repeating
          renderAt("#race", resultsView(raceStatus.positions)); // to render the results view
          resolve(raceStatus);
        } else {
          clearInterval(raceInterval); // to stop the interval from repeating
          resolve(raceStatus);
        }
      } catch (error) {
        console.log("Problem with handling getRace: ", error);
      }
    }, 500);
  }).catch((error) => console.log("Error in runRace:", error));
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      // Javascript's built in setInterval method to count down once per second
      const count = setInterval(() => {
        // console.log(timer);

        document.getElementById("big-numbers").innerHTML = --timer;

        if (timer <= 0) {
          clearInterval(count); // to stop the interval from repeating
          resolve();
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectRacer(target) {
  console.log("selected a pod", target.id);
  // remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  // add class selected to current target
  target.parentNode.classList.add("selected");

  showToastMessage(`${target.dataset.name} is selected`);
}

function handleSelectTrack(target) {
  console.log("selected a track", target.id);
  // remove class selected from all track options
  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  // add class selected to current target
  target.classList.add("selected");

  showToastMessage(`${target.dataset.name} is selected`);
}

function handleAccelerate() {
  console.log("accelerate button clicked");
  // TODO - Invoke the API call to accelerate
  accelerate(store.race_id)
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

// Function to render a list of racer cards
function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  // Use arrow function for cleaner syntax
  return racers.map(renderRacerCard).join("");
}

// Function to render a single racer card
function renderRacerCard(racer) {
  return `
		<li class="card racer cards-item" id="${racer.id}">
			<h3>${racer.driver_name}</h3>
			<div class="info">Speed: <b>${racer.top_speed}</b></div>
			<div class="info">Acceleration: <b>${racer.acceleration}</b></div>
			<div class="info">Handling: <b>${racer.handling}</b></div>
			<button class="button racer" id="${racer.id}" data-name="${racer.driver_name}">Choose</button>
		</li>
	`;
}

// Function to render a list of track cards
function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  return tracks.map(renderTrackCard).join("");
}

// Function to render a single track card
function renderTrackCard(track) {
  const { id, name } = track;

  return `<h4 id="${id}" data-name=${name} class="card track">${name}</h4>`;
}

// Function to render a countdown element
function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

// Function to render the starting view of a race
function renderRaceStartView(track) {
  return `
	<header>
		<h1>Race: Track ${track}</h1>
	</header>
	<main id="two-columns">
		<section id="leaderBoard">
			${renderCountdown(3)}
		</section>
		<section id="accelerate">
			<h2>Directions</h2>
			<p>Click the button as fast as you can to make your racer go faster!</p>
			<button id="gas-peddle">Click Me Speed up!!</button>
		</section>
	</main>
`;
}

// Function to render results view
function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));
  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main class="container">
			${raceProgress(positions, true)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

// Function to render race progress view
function raceProgress(positions, finish = false) {
  let userPlayer = positions.find((e) => e.id === Number(store.player_id));
  userPlayer.driver_name += " (you)";

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions
    .map((p) => {
      const isUserPlayer = p.id == userPlayer.id;

      return `
		<div class="${isUserPlayer ? "race-row highlight" : "race-row"}">
		  <div class="race-cell">${count++}</div>
		  <div class="race-cell">${p.driver_name}</div>
		</div>
	  `;
    })
    .join("");

  return `
		<h2 class="inRace">Leaderboard</h2>
		<div class="race-table">
			<div class="race-header">
			<div class="race-cell">${finish ? "Ranking" : "No."}</div>
			<div class="race-cell">Name</div>
			</div>
			${results}
		</div>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// Function notify message
function showToastMessage(message, type = "toast--info") {
  const toastContainer = document.createElement("div");
  toastContainer.classList.add("toast-message");
  toastContainer.classList.add(type);

  toastContainer.innerText = message;

  toastContainer.style.position = "fixed";
  toastContainer.style.bottom = "20px";
  toastContainer.style.right = "20px";
  toastContainer.style.zIndex = "9999";

  document.body.appendChild(toastContainer);

  // Automatically remove the toast message after a certain duration (e.g., 3 seconds)
  setTimeout(() => {
    toastContainer.remove();
  }, 3000);
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:3001";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

async function getTracks() {
  console.log(`calling server :: ${SERVER}/api/tracks`);
  try {
    const r = await fetch(`${SERVER}/api/tracks`, {
      method: "GET",
      dataType: "jsonp",
      ...defaultFetchOpts(),
    });
    console.log("getTracks:", r);
    return r.json();
  } catch (error) {
    console.log("Error occurred in getTracks: ", e);
  }
}

async function getRacers() {
  console.log(`calling server :: ${SERVER}/api/cars`);
  try {
    const r = await fetch(`${SERVER}/api/cars`, {
      method: "GET",
      dataType: "jsonp",
      ...defaultFetchOpts(),
    });
    console.log("getRacers:", r);
    return r.json();
  } catch (error) {
    console.log("Error occurred in getRacers: ", error);
  }
}

function createRace(player_id, track_id) {
  player_id = Number(player_id);
  track_id = Number(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: "POST",
    dataType: "jsonp",
    body: JSON.stringify(body),
    ...defaultFetchOpts(),
  })
    .then((res) => res.json())
    .catch((error) => console.log("Problem with createRace request::", error));
}

async function getRace(id) {
  try {
    const r = await fetch(`${SERVER}/api/races/${id}`, {
      method: "GET",
      dataType: "jsonp",
      ...defaultFetchOpts(),
    });
    return r.json();
  } catch (error) {
    console.log("Error occurred in getRace: ", error);
  }
}

// start race no response
function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: "POST",
    dataType: "jsonp",
    ...defaultFetchOpts(),
  }).catch((err) => console.log("Problem with getRace request::", err));
}

// accelerate no response
function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    dataType: "jsonp",
    ...defaultFetchOpts(),
  }).catch((error) => console.log(error));
}
