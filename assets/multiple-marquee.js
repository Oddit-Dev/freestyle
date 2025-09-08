document.addEventListener("DOMContentLoaded", () => {
  const marquees = document.querySelectorAll("[data-marquee-container]");
  const animations = [];
  
  // Initialize each marquee
  marquees.forEach((container, index) => {
      const track = container.querySelector("[data-marquee-track]");
      const trackPostion = container.getAttribute('data-marquee-direction');
      if (!track) return;
      
      // Set different speeds for each marquee for visual interest
      const speeds = [60, 75, 90];
      let direction = trackPostion;
      let position = 0;
      let speed = speeds[index];
      let isPaused = false;
      let animationId = null;
      
      // Duplicate the content for seamless looping
      track.innerHTML += track.innerHTML;
      const trackWidth = track.scrollWidth / 2;
      
      // Set initial transform
      track.style.transform = `translate3d(0, 0, 0)`;
      
      function animate(lastTime = performance.now()) {
          return function frame(time) {
              if (isPaused) return;
              
              const delta = (time - lastTime) / 1000;
              lastTime = time;
              
              position += direction * speed * delta;
              
              if (direction === -1) {
                  if (position <= -trackWidth) position += trackWidth;
              } else {
                  if (position >= 0) position -= trackWidth;
              }
              
              track.style.transform = `translate3d(${position}px, 0, 0)`;
              animationId = requestAnimationFrame(frame);
          };
      }
      
      // Start animation
      animationId = requestAnimationFrame(animate());
      
      // Drag to change direction
      let startX = null;
      container.addEventListener("mousedown", (e) => {
          startX = e.clientX;
          e.preventDefault();
      });
      
      container.addEventListener("mouseup", (e) => {
          if (startX !== null) {
              const deltaX = e.clientX - startX;
              direction = deltaX < 0 ? -1 : 1;
              startX = null;
          }
      });
      
      // Touch events for mobile
      container.addEventListener("touchstart", (e) => {
          startX = e.touches[0].clientX;
          e.preventDefault();
      });
      
      container.addEventListener("touchend", (e) => {
          if (startX !== null) {
              const deltaX = e.changedTouches[0].clientX - startX;
              direction = deltaX < 0 ? -1 : 1;
              startX = null;
          }
      });
      
      // Store animation control functions
      animations.push({
          pause: () => {
              isPaused = true;
              if (animationId) {
                  cancelAnimationFrame(animationId);
                  animationId = null;
              }
          },
          resume: () => {
              if (isPaused) {
                  isPaused = false;
                  animationId = requestAnimationFrame(animate());
              }
          },
          reverse: () => {
              direction *= -1;
          },
          getDirection: () => direction
      });
  });
  
  // Control buttons
  document.getElementById("pauseAll").addEventListener("click", () => {
      animations.forEach(animation => animation.pause());
  });
  
  document.getElementById("resumeAll").addEventListener("click", () => {
      animations.forEach(animation => animation.resume());
  });
  
  document.getElementById("reverseAll").addEventListener("click", () => {
      animations.forEach(animation => animation.reverse());
  });
});