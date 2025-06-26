// DOM element references
const button = document.querySelector("button");
const load = document.querySelector(".load");
const loadContent = document.querySelector(".load-content");
const content = document.querySelector(".content");
const progressBar = document.querySelector(".progress-bar");
const bar = document.querySelector(".bar");

// Approximate file size of the image used for download test (in bytes)
const downloadSize = 5447486; 

button.addEventListener("click", async () => {
  // Reset and show loading UI
  button.classList.add("hidden");
  load.classList.remove("hidden");
  progressBar.classList.remove("hidden");
  bar.style.width = "0%";
  content.classList.add("hidden");
  loadContent.classList.remove("result");
  content.innerHTML = "--<small>Kbps</small>";

  const imageLink = "https://patch-lnd.github.io/speed-test-assets/img.jpg";
  const cacheBuster = "?nn=" + Date.now(); // Prevent browser caching

  let loadedBytes = 0;
  let startTime = Date.now();
  let lastProgressTime = Date.now();
  let abortController = new AbortController();

  // Used to detect network stalls
  const stallTimeout = 10000; // 10 seconds

  // Used to detect speed stabilization
  const speedHistory = [];
  const maxHistory = 3; // Keep 3 speed samples
  const speedStabilityThreshold = 5; // In Kbps (if speed changes less than this over 3s, we consider it stable)

  // Check if speed has stabilized
  function hasStableSpeed() {
    if (speedHistory.length < maxHistory) return false;
    const max = Math.max(...speedHistory);
    const min = Math.min(...speedHistory);
    return (max - min) < speedStabilityThreshold;
  }

  // Background interval to detect stalls
  function startStallCheck() {
    return setInterval(() => {
      if (Date.now() - lastProgressTime > stallTimeout) {
        abortController.abort(); // Abort if no progress in 10s
      }
    }, 500);
  }

  const stallChecker = startStallCheck();

  try {
    const response = await fetch(imageLink + cacheBuster, { signal: abortController.signal });
    if (!response.body) throw new Error("ReadableStream not supported in this browser");

    const reader = response.body.getReader();

    // Read the stream chunk by chunk
    let lastSampleTime = Date.now();

    async function readStream() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        loadedBytes += value.length;
        lastProgressTime = Date.now();

        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000; // seconds
        const speedKbps = ((loadedBytes * 8) / elapsedTime / 1024);

        // Store speed samples every 1 second
        if (currentTime - lastSampleTime >= 1000) {
          speedHistory.push(speedKbps);
          if (speedHistory.length > maxHistory) speedHistory.shift(); // Keep only latest N

          if (hasStableSpeed()) {
            abortController.abort(); // ✅ Stop early if speed is stable
            break;
          }

          lastSampleTime = currentTime;
        }

        // Update progress bar (based on downloaded percentage)
        const progressPercent = Math.min((loadedBytes / downloadSize) * 100, 100);
        bar.style.width = progressPercent + "%";
      }
    }

    await readStream();
    clearInterval(stallChecker); // Clean up interval
    bar.style.width = "100%"; // Ensure full progress on success

  } catch (e) {
    clearInterval(stallChecker); // Clean up on error or abort
  } finally {
    // Calculate final speed
    const elapsedTime = (Date.now() - startTime) / 1000;
    const finalSpeedKbps = ((loadedBytes * 8) / elapsedTime / 1024).toFixed(2);

    // Animate counter up for smoother UX
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

    // Final UI updates
    load.classList.add("hidden");
    progressBar.classList.add("hidden");
    content.classList.remove("hidden");
    loadContent.classList.add("result");
    button.classList.remove("hidden");
    button.innerText = "Check Again";
  }
});
