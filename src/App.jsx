import { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2, Download, Upload, ChefHat, ExternalLink, Book } from 'lucide-react';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);

  const STORAGE_KEY = 'recipes_app';

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Starting fresh');
      setRecipes([]);
    }
  };

  const saveRecipes = (updatedRecipes) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
      return true;
    } catch (error) {
      alert('❌ Opslaan mislukt: ' + error.message);
      return false;
    }
  };

  const categories = ['Vlees', 'Vis', 'Vegetarisch', 'Voorgerecht', 'Toetje', 'Bijgerecht', 'Thomas', 'Other'];

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Vlees': return 'bg-red-100 text-red-700';
      case 'Vis': return 'bg-blue-100 text-blue-700';
      case 'Vegetarisch': return 'bg-green-100 text-green-700';
      case 'Thomas': return 'bg-purple-100 text-purple-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    categories: [],
    sourceType: 'online',
    sourceUrl: '',
    bookTitle: '',
    bookAuthor: '',
    bookPage: '',
    ingredients: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    guests: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      categories: [],
      sourceType: 'online',
      sourceUrl: '',
      bookTitle: '',
      bookAuthor: '',
      bookPage: '',
      ingredients: '',
      instructions: '',
      prepTime: '',
      cookTime: '',
      servings: '',
      guests: '',
      notes: ''
    });
    setEditingRecipe(null);
    setShowAddForm(false);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      alert('Vul minimaal een receptnaam in');
      return;
    }

    if (formData.categories.length === 0) {
      formData.categories = ['Other'];
    }

    const recipe = {
      ...formData,
      id: editingRecipe ? editingRecipe.id : Date.now().toString(),
      createdAt: editingRecipe ? editingRecipe.createdAt : new Date().toISOString()
    };

    let updatedRecipes;
    if (editingRecipe) {
      updatedRecipes = recipes.map(r => r.id === editingRecipe.id ? recipe : r);
    } else {
      updatedRecipes = [...recipes, recipe];
    }

    const success = saveRecipes(updatedRecipes);
    if (success) {
      alert('✅ Recept opgeslagen!');
      resetForm();
    }
  };

  const handleEdit = (recipe) => {
    setFormData({
      ...recipe,
      categories: recipe.categories || ['Other']
    });
    setEditingRecipe(recipe);
    setShowAddForm(true);
    setViewingRecipe(null);
  };

  const exportRecipes = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recepten-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('✅ Recepten geëxporteerd!');
  };

  const importRecipes = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          saveRecipes([...recipes, ...imported]);
          alert(`✅ ${imported.length} recepten geïmporteerd!`);
        } else {
          alert('❌ Ongeldig bestandsformaat');
        }
      } catch (error) {
        alert('❌ Fout bij importeren: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Dynamically import xlsx
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

          const converted = rows.slice(1).map((row, index) => {
            const name = row[0] || '';
            const source = row[1] || '';
            const ingredients = row[2] || '';
            const category1 = row[3] || '';
            const category2 = row[4] || '';
            
            if (!name) return null;
            
            const categories = [];
            if (category1) categories.push(category1.trim());
            if (category2) categories.push(category2.trim());
            if (categories.length === 0) categories.push('Other');
            
            const isUrl = source.startsWith('http://') || source.startsWith('https://') || source.includes('www.');
            
            return {
              id: Date.now().toString() + '_' + index,
              name: name,
              categories: categories,
              sourceType: isUrl ? 'online' : 'book',
              sourceUrl: isUrl ? source : '',
              bookTitle: isUrl ? '' : source,
              bookAuthor: '',
              bookPage: '',
              ingredients: ingredients,
              instructions: '',
              prepTime: '',
              cookTime: '',
              servings: '',
              guests: '',
              notes: '',
              createdAt: new Date().toISOString()
            };
          }).filter(r => r !== null);

          if (converted.length > 0) {
            saveRecipes([...recipes, ...converted]);
            alert(`✅ ${converted.length} recepten geïmporteerd uit Excel!`);
          } else {
            alert('❌ Geen recepten gevonden');
          }
        } catch (error) {
          alert(`❌ Fout: ${error.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      alert(`❌ Fout: ${error.message}`);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.ingredients && recipe.ingredient
