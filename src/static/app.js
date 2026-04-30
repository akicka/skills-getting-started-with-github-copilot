document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity selector
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const h4 = document.createElement("h4");
        h4.textContent = name;
        activityCard.appendChild(h4);

        const descP = document.createElement("p");
        descP.textContent = details.description;
        activityCard.appendChild(descP);

        const scheduleP = document.createElement("p");
        const scheduleBold = document.createElement("strong");
        scheduleBold.textContent = "Schedule:";
        scheduleP.appendChild(scheduleBold);
        scheduleP.append(` ${details.schedule}`);
        activityCard.appendChild(scheduleP);

        const availP = document.createElement("p");
        const availBold = document.createElement("strong");
        availBold.textContent = "Availability:";
        availP.appendChild(availBold);
        availP.append(` ${spotsLeft} spots left`);
        activityCard.appendChild(availP);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        if (details.participants.length) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = email;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "remove-participant-btn";
            button.dataset.activity = name;
            button.dataset.email = email;
            button.setAttribute("aria-label", `Remove ${email} from ${name}`);
            button.title = "Remove participant";
            button.textContent = "\u00D7";

            li.appendChild(span);
            li.appendChild(button);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const emptyP = document.createElement("p");
          emptyP.className = "participants-empty";
          emptyP.textContent = "No participants yet. Be the first to sign up!";
          participantsSection.appendChild(emptyP);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle participant removal via click on the delete icon button
  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant-btn");
    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Could not remove participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
