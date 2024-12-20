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

  // Loop through each meal in the mealData and generate the shopping list
  mealData.forEach(meal => {
    // Remove everything after the first comma (if any)
    const cleanIngredients = meal.ingredients.map(ingredient => {
      return ingredient.split(',')[0].trim(); // Split by comma and take the first part
    });

    // Add each cleaned ingredient to the shopping list
    cleanIngredients.forEach(ingredient => {
      const listItem = document.createElement('li');
      listItem.textContent = ingredient;
      shoppingListContainer.appendChild(listItem);
    });
  });

  // Add download functionality to the "Download" button
  const downloadButton = document.getElementById('download-button');
  downloadButton.addEventListener('click', function() {
    const shoppingListText = Array.from(shoppingListContainer.children)
      .map(item => item.textContent)
      .join('\n'); // Join items with a new line for the text file
    
    // Create a Blob with the shopping list text
    const blob = new Blob([shoppingListText], { type: 'text/plain' });
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'shopping-list.txt'; // Filename for the downloaded file
    
    // Programmatically click the link to trigger the download
    link.click();
  });

  // Event listener to close the shopping list
  closeButton.addEventListener('click', () => {
    document.querySelector('.shopping-list-container').style.display = 'none'; // Hide the shopping list container
  });
}
