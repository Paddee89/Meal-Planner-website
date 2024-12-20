// Global variables to store the current and previous meal plans
window.currentMealPlan = [];
window.previousMealPlan = [];

// Fetch the meal library from the JSON file
async function fetchMealLibrary() {
  try {
    const response = await fetch('mealLibrary.json');
    if (!response.ok) {
      throw new Error('Failed to load meal library');
    }
    const data = await response.json();
    console.log('Loaded meal library:', data);
    return data;
  } catch (error) {
    console.error('Error loading meal library:', error);
    alert('Error: Unable to load meal library');
    return [];
  }
}

// Function to generate the meal plan based on criteria
async function generateMealPlan() {
  try {
    const mealLibrary = await fetchMealLibrary();

    if (!mealLibrary || mealLibrary.length === 0) {
      console.error('No meals available in meal library');
      alert('No meals available!');
      return;
    }

    // Store the previous meal plan before generating a new one
    window.previousMealPlan = [...window.currentMealPlan];

    // Filtering meals by type
    let meatMeals = mealLibrary.filter(meal => meal.type === "meat");
    let fishMeals = mealLibrary.filter(meal => meal.type === "fish");
    let vegetarianMeals = mealLibrary.filter(meal => meal.type === "vegetarian");

    // Ensure that we have enough meals for each category
    if (meatMeals.length < 2 || fishMeals.length < 1 || vegetarianMeals.length < 3) {
      alert('Not enough meals available in each category');
      return;
    }

    // Track selected meals to avoid duplicates
    let selectedMeals = [];

    // Randomly select the required meals from each category
    const selectedMeatMeals = getRandomMeals(meatMeals, 2, selectedMeals);
    const selectedFishMeals = getRandomMeals(fishMeals, 1, selectedMeals);
    const selectedVegetarianMeals = getRandomMeals(vegetarianMeals, 3, selectedMeals);

    // Combine selected meals
    selectedMeals = [...selectedMeatMeals, ...selectedFishMeals, ...selectedVegetarianMeals];

    // Shuffle the selected meals to randomize the meal plan
    shuffleArray(selectedMeals);

    // Store the meal plan globally
    window.currentMealPlan = selectedMeals;

    // Display the meal plan
    displayMealPlan(selectedMeals);

    // Show the "Generate Shopping List" button
    document.getElementById('shopping-list-button').style.display = 'block';
  } catch (error) {
    console.error('Error generating meal plan:', error);
    alert('An error occurred while generating your meal plan.');
  }
}

// Function to undo the previous meal plan action
function undoMealPlan() {
  if (window.previousMealPlan.length > 0) {
    window.currentMealPlan = [...window.previousMealPlan]; // Restore the previous meal plan
    displayMealPlan(window.currentMealPlan); // Re-display the meal plan
    window.previousMealPlan = []; // Clear the previous meal plan
  } else {
    alert('No previous meal plan to undo!');
  }
}

// Function to get a random selection of meals
function getRandomMeals(meals, count, selectedMeals) {
  const selected = [];
  while (selected.length < count) {
    const randomIndex = Math.floor(Math.random() * meals.length);
    const meal = meals[randomIndex];
    if (!selected.includes(meal) && !selectedMeals.includes(meal)) {
      selected.push(meal);
      selectedMeals.push(meal);
    }
  }
  return selected;
}

// Function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to display the meal plan
function displayMealPlan(mealPlan) {
  document.getElementById('meal-plan-container').style.display = 'block';
  document.querySelector('.hero-section').style.display = 'none';

  const mealGrid = document.getElementById('meal-grid');
  mealGrid.innerHTML = '';

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  mealPlan.forEach((meal, index) => {
    const mealBox = document.createElement("div");
    mealBox.classList.add("meal-day");
    mealBox.innerHTML = `
  <h3>${dayNames[index]}</h3>
  <p>${meal.name}</p>
  <div class="button-container">
    <button class="replace-button" data-meal-type="${meal.type}" data-index="${index}">Replace</button>
    <button class="takeout-button">Takeout day</button>
    <button class="cheatday-button" data-index="${index}">Cheat day</button>
  </div>
`;

    // Add event listeners
    mealBox.querySelector('.replace-button').addEventListener('click', (e) => {
      e.stopPropagation();
      replaceMeal(meal, mealPlan);
    });

    mealBox.querySelector('.takeout-button').addEventListener('click', (e) => {
      e.stopPropagation();
      meal.name = "Takeout!";
      displayMealPlan(mealPlan);
    });

    mealBox.querySelector('.cheatday-button').addEventListener('click', handleCheatDayClick);

    // Add event listener to display recipe
    mealBox.addEventListener('click', () => {
      displayRecipe(meal);
    });

    mealGrid.appendChild(mealBox);
  });
}

function handleCheatDayClick(e) {
  e.stopPropagation();
  const index = parseInt(e.target.dataset.index, 10);
  replaceWithCheatMeal(window.currentMealPlan[index], window.currentMealPlan, index);
}

// Function to display the recipe
function displayRecipe(meal) {
  const recipeContainer = document.createElement('div');
  recipeContainer.classList.add('recipe-container');

  recipeContainer.innerHTML = `
    <h2>${meal.name}</h2>
    <h3>Carb Source: ${meal.carbSource || 'Not specified'}</h3>
    <h3>Fat Content: ${meal.fat || 'Not specified'}</h3>
    <h3>Ingredients:</h3>
    <ul>${meal.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}</ul>
    <h3>Directions:</h3>
    <ul>${meal.directions.map(step => `<li>${step}</li>`).join('')}</ul>
    <button onclick="this.parentElement.remove()">Close</button>
  `;

  document.body.appendChild(recipeContainer);
}

// Function to replace a meal
async function replaceMeal(meal, mealPlan) {
  // Save the current state before making a change (for undo)
  window.previousMealPlan = [...window.currentMealPlan];
  
  const mealLibrary = await fetchMealLibrary();
  const newMeal = getNewMeal(meal, mealLibrary, mealPlan);
  const updatedMealPlan = mealPlan.map(m => m.name === meal.name ? newMeal : m);
  window.currentMealPlan = updatedMealPlan;
  displayMealPlan(updatedMealPlan);
}

function getNewMeal(currentMeal, mealLibrary, mealPlan) {
  const mealsByType = mealLibrary.filter(m => m.type === currentMeal.type);
  const availableMeals = mealsByType.filter(m => 
    m.name !== currentMeal.name && !mealPlan.some(existing => existing.name === m.name)
  );
  return availableMeals.length > 0 ? availableMeals[Math.floor(Math.random() * availableMeals.length)] : currentMeal;
}

async function replaceWithCheatMeal(meal, mealPlan, index) {
  // Save the current state before making a change (for undo)
  window.previousMealPlan = [...window.currentMealPlan];

  const mealLibrary = await fetchMealLibrary();
  const cheatMeals = mealLibrary.filter(meal => meal.type === "cheatday");

  console.log("Available cheat meals:", cheatMeals); // Debugging line

  if (cheatMeals.length > 0) {
    // Get a random cheat day meal that is not already in the meal plan for other days
    const availableCheatMeals = cheatMeals.filter(cheatMeal =>
      !mealPlan.some(planMeal => planMeal.name === cheatMeal.name)
    );

    console.log("Filtered cheat meals (not in meal plan):", availableCheatMeals); // Debugging line

    if (availableCheatMeals.length > 0) {
      mealPlan[index] = availableCheatMeals[Math.floor(Math.random() * availableCheatMeals.length)];
    } else {
      // If all cheat meals are already used, allow reusing any cheat meal
      mealPlan[index] = cheatMeals[Math.floor(Math.random() * cheatMeals.length)];
    }

    window.currentMealPlan = mealPlan;
    displayMealPlan(mealPlan);
  } else {
    alert("No cheat day meals available!");
  }
}

// Save the current meal plan to localStorage
function saveMealPlan() {
  const mealPlanName = document.getElementById('meal-plan-name').value.trim();
  
  if (!mealPlanName) {
    alert('Please enter a meal plan name.');
    return;
  }

  if (!window.currentMealPlan || window.currentMealPlan.length === 0) {
    alert('No meal plan generated to save.');
    return;
  }

  // Create an object to store the meal plan
  const mealPlanToSave = {
    name: mealPlanName,
    meals: window.currentMealPlan
  };

  // Save to localStorage
  let savedPlans = JSON.parse(localStorage.getItem('savedMealPlans')) || [];
  savedPlans.push(mealPlanToSave);
  localStorage.setItem('savedMealPlans', JSON.stringify(savedPlans));

  alert('Meal plan saved!');
  loadSavedMealPlans();  // Reload the saved plans dropdown
}

// Load saved meal plans into the dropdown
function loadSavedMealPlans() {
  const savedPlansDropdown = document.getElementById('saved-plans-dropdown');
  const savedPlans = JSON.parse(localStorage.getItem('savedMealPlans')) || [];

  // Clear existing options
  savedPlansDropdown.innerHTML = '<option value="">Select Saved Meal Plan</option>';

  // Populate the dropdown with saved meal plans
  savedPlans.forEach(plan => {
    const option = document.createElement('option');
    option.value = plan.name;
    option.textContent = plan.name;
    savedPlansDropdown.appendChild(option);
  });
}

// Load the selected meal plan into the meal grid
function loadMealPlan() {
  const savedPlansDropdown = document.getElementById('saved-plans-dropdown');
  const selectedPlanName = savedPlansDropdown.value;

  if (!selectedPlanName) {
    alert('Please select a saved meal plan.');
    return;
  }

  // Find the selected meal plan from localStorage
  const savedPlans = JSON.parse(localStorage.getItem('savedMealPlans')) || [];
  const selectedPlan = savedPlans.find(plan => plan.name === selectedPlanName);

  if (selectedPlan) {
    // Load the meals into the current meal plan
    window.currentMealPlan = selectedPlan.meals;
    displayMealPlan(window.currentMealPlan);  // Display the selected meal plan
  } else {
    alert('Meal plan not found.');
  }
}

// Event listeners
document.getElementById('save-button').addEventListener('click', saveMealPlan);
document.getElementById('saved-plans-dropdown').addEventListener('change', loadMealPlan);

// When the page loads, load the saved meal plans into the dropdown
document.addEventListener('DOMContentLoaded', loadSavedMealPlans);

// Delete the selected meal plan
function deleteMealPlan() {
  const savedPlansDropdown = document.getElementById('saved-plans-dropdown');
  const selectedPlanName = savedPlansDropdown.value;

  if (!selectedPlanName) {
    alert('Please select a saved meal plan to delete.');
    return;
  }

  // Retrieve saved meal plans from localStorage
  let savedPlans = JSON.parse(localStorage.getItem('savedMealPlans')) || [];

  // Filter out the plan to be deleted
  const updatedPlans = savedPlans.filter(plan => plan.name !== selectedPlanName);

  // Save the updated plans back to localStorage
  localStorage.setItem('savedMealPlans', JSON.stringify(updatedPlans));

  alert(`Meal plan "${selectedPlanName}" deleted successfully!`);

  // Reload the dropdown
  loadSavedMealPlans();
}

// Add event listener for the delete button
document.getElementById('delete-button').addEventListener('click', deleteMealPlan);

// Event listeners
document.getElementById('generate-button').addEventListener('click', generateMealPlan);
document.getElementById('shopping-list-button').addEventListener('click', () => {
  if (window.currentMealPlan && window.currentMealPlan.length > 0) {
    generateShoppingList(window.currentMealPlan);
  } else {
    alert('No meal plan generated yet!');
  };
});

// Event listener for the undo button
document.getElementById('undo-button').addEventListener('click', undoMealPlan);

// Function to generate shopping list
function generateShoppingList(mealData) {
  const shoppingListContainer = document.querySelector('.shopping-list-container ul');
  const closeButton = document.getElementById('close-button'); // Close button reference

  if (!shoppingListContainer) {
    console.error("Shopping list container not found!");
    return;
  }

  shoppingListContainer.innerHTML = ''; // Clear the previous list

  // Show the shopping list container
  document.querySelector('.shopping-list-container').style.display = 'block';

  // Extract ingredients and quantities from mealData
  mealData.forEach(meal => {
    meal.ingredients.forEach(ingredient => {
      const listItem = document.createElement('li');
      listItem.textContent = ingredient;
      shoppingListContainer.appendChild(listItem);
    });
  });

  // Close the shopping list when the close button is clicked
  closeButton.addEventListener('click', () => {
    document.querySelector('.shopping-list-container').style.display = 'none';
  });
}
