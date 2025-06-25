
const button = document.querySelector("button");
const load = document.querySelector(".load");
const loadContent = document.querySelector(".load-content");
const content = document.querySelector(".content");
const progressBar = document.querySelector(".progress-bar");
const bar = document.querySelector(".bar");

// Image file size in bytes (approximate)
const downloadSize = 5447486; 

button.addEventListener("click", async () => {
  button.classList.add("hidden");
  load.classList.remove("hidden");
  progressBar.classList.remove("hidden");
  bar.style.width = "0%";
  content.classList.add("hidden");
  loadContent.classList.remove("result");
  content.innerHTML = "--<small>Kbps</small>";

  const imageLink = "https://patch-lnd.github.io/speed-test-assets/img.jpg";
  const cacheBuster = "?nn=" + Date.now();

  let loadedBytes = 0;
  let startTime = Date.now();
  let lastProgressTime = Date.now();
  let abortController = new AbortController();

  // Stall timeout in ms
  const stallTimeout = 10000; // 10 seconds

  // Start stall timer function
  function startStallCheck() {
    return setInterval(() => {
      if (Date.now() - lastProgressTime > stallTimeout) {
        // Stall detected: abort fetch
        abortController.abort();
      }
    }, 500);
  }

  const stallChecker = startStallCheck();

  try {
    const response = await fetch(imageLink + cacheBuster, { signal: abortController.signal });
    if (!response.body) throw new Error("ReadableStream not supported");

    const reader = response.body.getReader();

    // Function to read stream chunks
    async function read() {
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        loadedBytes += value.length;
        lastProgressTime = Date.now();

        // Update progress bar (percentage)
        const progressPercent = Math.min((loadedBytes / downloadSize) * 100, 100);
        bar.style.width = progressPercent + "%";

        // Calculate speed in Kbps
        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
        const speedKbps = ((loadedBytes * 8) / elapsedTime / 1024).toFixed(2);
      }
    }

    await read();

    clearInterval(stallChecker);

    // Finished successfully
    bar.style.width = "100%";
  } catch (e) {
    // Aborted or error - treat as stall and finalize
    clearInterval(stallChecker);
  } finally {
    // Calculate final speed
    const elapsedTime = (Date.now() - startTime) / 1000;
    const finalSpeedKbps = ((loadedBytes * 8) / elapsedTime / 1024).toFixed(2);

    // Animate final speed counting up for smooth UX
    let displayedSpeed = 0;
    const speedStep = Math.max(finalSpeedKbps / 30, 1);

    function animateSpeed() {
      if (displayedSpeed < finalSpeedKbps) {
        displayedSpeed = Math.min(displayedSpeed + speedStep, finalSpeedKbps);
        content.innerHTML = displayedSpeed.toFixed(2) + "<small>Kbps</small>";
        setTimeout(animateSpeed, 20);
      } else {
        content.innerHTML = finalSpeedKbps + "<small>Kbps</small>";
      }
    }
    animateSpeed();

    // Cleanup UI states
    load.classList.add("hidden");
    progressBar.classList.add("hidden");

    // Update UI speed display live
        content.classList.remove("hidden");

    loadContent.classList.add("result");
    button.classList.remove("hidden");
    button.innerText = "Check Again";
  }
});