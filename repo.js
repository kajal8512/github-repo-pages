let repositoriesPerPage = 10; // Default value
let currentPage = 1;
const loader = document.getElementById("loader");
let username;

const repositoriesPerPageSelector = document.getElementById(
  "repositoriesPerPage"
);
repositoriesPerPageSelector.addEventListener("change", () => {
  repositoriesPerPage = parseInt(repositoriesPerPageSelector.value);
  currentPage = 1; // Reset current page when changing repositories per page
  fetchRepositories(currentPage);
});

// Modify the searchRepositories function to use the input value
async function searchUser() {
  const usernameInput = document.getElementById("usernameInput");
  const username = usernameInput.value.trim();
  if (username === "") {
    alert("Please enter a GitHub username.");
    return;
  }

  loader.style.display = "block"; // Display loader while fetching data

  try {
    await fetchRepositories(currentPage, username);

    // Fetch user profile
    const profileUrl = `https://api.github.com/users/${username}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();
    updatePagination(profileData.public_repos);

    // Check if the API request for profile was successful
    if (profileResponse.ok) {
      document.getElementById("user-avatar").src = profileData.avatar_url || "";
      document.getElementById("user-name").textContent =
        profileData.name || "N/A";
    } else {
      console.error("Error fetching profile data:", profileData.message);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loader.style.display = "none"; // Hide loader after fetching data
  }
}

const repositoriesContainer = document.getElementById("repositories-container");
function displayRepositories(repositories) {
  repositoriesContainer.innerHTML = "";

  repositories.forEach((repo) => {
    const repoElement = document.createElement("div");
    repoElement.className = "repository";
    repoElement.innerHTML = `<h2>${repo.name}</h2>
                                <p>${
                                  repo.description || "No description available"
                                }</p>
                                <p>${
                                  repo.languages.length > 0
                                    ? repo.languages
                                        .map(
                                          (language) =>
                                            `<span class="language">${language}</span>`
                                        )
                                        .join(", ")
                                    : "Not specified"
                                }</p>
                                <a href="${
                                  repo.html_url
                                }" target="_blank">View on GitHub</a>`;
    repositoriesContainer.appendChild(repoElement);
  });
}

async function fetchRepositories(page, username) {
  loader.style.display = "block";

  try {
    let apiUrlForUser = `https://api.github.com/users/${username}/repos`;

    const response = await fetch(
      `${apiUrlForUser}?page=${page}&per_page=${repositoriesPerPage}`
    );

    // Check if the API request was not successful
    if (!response.ok) {
      console.error("Error fetching repositories:", response.statusText);
      return;
    }

    const data = await response.json();
    await Promise.all(
      data.map(async (repo) => {
        if (repo.languages_url) {
          const detailsResponse = await fetch(repo.languages_url);
          const detailsData = await detailsResponse.json();
          repo.languages = Object.keys(detailsData);
        } else {
          repo.languages = [];
        }
      })
    );
    displayRepositories(data);
  } catch (error) {
    console.error("Error fetching repositories:", error);
  } finally {
    loader.style.display = "none";
  }
}

let totalPages;
function updatePagination(totalRepositories) {
  const totalPages = Math.ceil(totalRepositories / repositoriesPerPage);
  const paginationList = document.getElementById("pagination-list");
  paginationList.innerHTML = "";

  const visiblePages = 9;
  let startPage, endPage;

  if (totalPages <= visiblePages) {
    // If there are fewer total pages than the visiblePages, display all pages
    startPage = 1;
    endPage = totalPages;
  } else {
    // Otherwise, calculate the range based on the current page
    startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    endPage = Math.min(startPage + visiblePages - 1, totalPages);

    // Adjust the startPage if the endPage is at the last page
    startPage = Math.max(1, endPage - visiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("li");
    pageButton.textContent = i;

    // Add a class to the current active page
    if (i === currentPage) {
      pageButton.classList.add("active");
    }

    pageButton.addEventListener("click", () =>
      fetchRepositories(
        i,
        document.getElementById("usernameInput").value.trim()
      )
    );
    paginationList.appendChild(pageButton);
  }

  document
    .getElementById("previous-page")
    .addEventListener("click", async () => {
      if (currentPage > 1) {
        currentPage -= 1; // Update currentPage before fetching the previous page
        await fetchRepositories(currentPage, username);
      }
    });

  document.getElementById("next-page").addEventListener("click", async () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      await fetchRepositories(currentPage, username);
    }
  });
}

window.onload = function () {
  const initialUsernameInput = document.getElementById("usernameInput");
  const initialUsername = initialUsernameInput.value.trim();

  if (initialUsername) {
    username = initialUsername;
    searchUser();
  }
};

// Initial fetch on page load
fetchRepositories(currentPage, username);
