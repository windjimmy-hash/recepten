export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

4. Klik "Commit changes"

**En maak ook een .gitignore aan:**
1. Klik op "Add file" → "Create new file"
2. Naam: `.gitignore`
3. Plak deze inhoud:
```
node_modules
dist
.DS_Store
