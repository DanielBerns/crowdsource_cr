// js/form-ui.js
document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category');
    
    // Check if the select element exists and the categories data is loaded
    if (categorySelect && typeof reportCategories !== 'undefined') {
        reportCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });
    }
});