// Updated sample data to include categories and subcategories
const categoryData = {
  'Еда': ['Sub1', 'Sub2'],
  'Разное': ['Sub3', 'Sub4'],
  'Здоровье': ['Sub5'],
  // ... add other categories and their subcategories
};

const subcategoryData = {
  'Sub1': 31.9,
  'Sub2': 13.8,
  'Sub3': 11,
  'Sub4': 11,
  'Sub5': 11,
  // ... add other subcategories and their values
};
const colors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba'];

const monthlySpendings = {
  'Dec 2023': 250,
  // ... add other months and their spendings
};

// Functions to update the charts
function updatePieChart(subcategory) {
  subcategoryPieChart.data.datasets[0].data = subcategory ? [subcategoryData[subcategory]] : Object.values(subcategoryData);
  subcategoryPieChart.update();
}

function updateBarGraph() {
  monthlySpendingsBarGraph.data.datasets[0].data = Object.values(monthlySpendings);
  monthlySpendingsBarGraph.update();
}

// Populate category filter
const categoryFilter = document.getElementById('category-filter');
Object.keys(categoryData).forEach(category => {
  let option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  categoryFilter.appendChild(option);
});

// Handle category filter change
categoryFilter.addEventListener('change', function() {
  const subcategories = categoryData[this.value] || [];
  populateSubcategoryFilter(subcategories);
  updatePieChart();
});

// Populate subcategory filter based on category
function populateSubcategoryFilter(subcategories) {
  const subcategoryFilter = document.getElementById('subcategory-filter');
  subcategoryFilter.innerHTML = ''; // Clear existing options
  subcategories.forEach(sub => {
    let option = document.createElement('option');
    option.value = sub;
    option.textContent = sub;
    subcategoryFilter.appendChild(option);
  });
  updatePieChart(subcategories[0]); // Update the chart for the first subcategory
}

// Handle subcategory filter change
document.getElementById('subcategory-filter').addEventListener('change', function() {
  updatePieChart(this.value);
});

// Initialize the pie chart
const ctxPieChart = document.getElementById('subcategory-piechart').getContext('2d');
const subcategoryPieChart = new Chart(ctxPieChart, {
  type: 'pie',
  data: {
    labels: Object.keys(subcategoryData),
    datasets: [{
      data: subcategoryData,
      backgroundColor: colors,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      position: 'right',
      labels: {
        fontColor: 'white'
      }
    }
  }
});

// Initialize the bar graph
const ctxBarGraph = document.getElementById('monthly-spendings-bargraph').getContext('2d');
const monthlySpendingsBarGraph = new Chart(ctxBarGraph, {
  type: 'bar',
  data: {
    labels: Object.keys(demoMonthlySpendings),
    datasets: [{
      label: 'Расход',
      data: Object.values(demoMonthlySpendings),
      backgroundColor: ['#f67019'],
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          fontColor: 'white'
        }
      }],
      xAxes: [{
        ticks: {
          fontColor: 'white'
        }
      }]
    }
  }
});

// Initial population of subcategories
populateSubcategoryFilter(Object.keys(subcategoryData));