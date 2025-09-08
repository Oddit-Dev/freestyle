document.addEventListener("DOMContentLoaded", () => {
  const marquees = document.querySelectorAll(".multiple-marquee-section [data-marquee-container]");


  marquees.forEach((container) => {
    const track = container.querySelector("[data-marquee-track]");
    if (!track) return;

    const directionGet = parseInt(container.getAttribute("data-marquee-direction"));
    let direction = directionGet;
    let position = 0;
    const speed = 60;

    // Duplicate the content for seamless looping
    track.innerHTML += track.innerHTML;
    const trackWidth = track.scrollWidth / 2;

    track.style.willChange = "transform";
    track.style.transform = `translate3d(0, 0, 0)`;

    function animate(lastTime = performance.now()) {
      return function frame(time) {
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        position += direction * speed * delta;

        if (direction === -1) {
          if (position <= -trackWidth) position += trackWidth;
        } else {
          if (position >= 0) position -= trackWidth;
        }

        track.style.transform = `translate3d(${position}px, 0, 0)`;
        requestAnimationFrame(frame);
      };
    }

    // Start animation
    requestAnimationFrame(animate());

    // Drag to change direction
    let startX = null;
    container.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      e.preventDefault(); // Prevent text selection
    });

    container.addEventListener("mouseup", (e) => {
      if (startX !== null) {
        const deltaX = e.clientX - startX;
        direction = deltaX < 0 ? -1 : 1;
        startX = null;
      }
    });
  });
});
