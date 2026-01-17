# TRAK Landing Page - Static Version

This is a pure HTML/CSS/JavaScript version of the improved TRAK landing page, designed to be deployed directly to GitHub Pages.

## Files Included

- `index.html` - Main landing page HTML
- `styles.css` - Complete styling (Modern Enterprise Minimalism design)
- `script.js` - Interactive functionality and form handling
- `images/` - Directory containing visual assets:
  - `hero-dashboard-mockup.png` - Dashboard visualization
  - `privacy-first-illustration.png` - Privacy concept illustration
  - `ai-tools-ecosystem.png` - AI tools integration diagram

## How to Deploy to GitHub Pages

### Option 1: Replace docs/ folder (Recommended)

1. Copy all files from this directory into your repository's `docs/` folder:
   ```bash
   cp -r * /path/to/your/repo/docs/
   ```

2. Ensure your GitHub repository settings are configured:
   - Go to Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select "main" branch and "/docs" folder
   - Save

3. Your landing page will be live at: `https://yourusername.github.io/trak/`

### Option 2: Use as root (if deploying to user/org site)

1. Copy files to the root of your repository
2. Configure GitHub Pages to use the main branch
3. Your site will be live at: `https://yourusername.github.io/`

## Design Features

### Modern Enterprise Minimalism
- **Color Palette**: Deep Slate (#1e293b) + Vibrant Teal (#14b8a6)
- **Typography**: Space Grotesk (headlines) + Inter (body)
- **Layout**: Asymmetric grids with generous whitespace
- **Interactions**: Smooth transitions and hover effects

### Sections
1. **Hero** - Compelling headline with dashboard mockup
2. **Crisis** - Problem statement with three key pain points
3. **Solution** - Feature showcase with visual assets
4. **Comparison** - Competitive advantage table
5. **Pricing** - Three-tier pricing structure
6. **CTA** - Early access form with benefits
7. **Footer** - Navigation and legal links

## Customization

### Update Form Submission
In `script.js`, replace the form submission handler with your actual backend API:

```javascript
// Replace this section in the form submission handler:
fetch('/api/early-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => {
    console.log('Success:', result);
    alert('Thank you for your interest!');
    form.reset();
})
.catch(error => console.error('Error:', error));
```

### Update Links
- Replace placeholder links in the navigation and footer
- Update social media links
- Add your actual product demo video URL

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary: #14b8a6;        /* Change primary color */
    --slate-900: #1e293b;      /* Change text color */
    /* ... other variables ... */
}
```

### Update Images
Replace the images in the `images/` folder with your own:
- `hero-dashboard-mockup.png` - Your dashboard screenshot
- `privacy-first-illustration.png` - Your privacy illustration
- `ai-tools-ecosystem.png` - Your ecosystem diagram

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Fully static - no build process required
- Optimized images for fast loading
- CSS and JS are minified and inlined
- Smooth scrolling and animations

## SEO

- Semantic HTML structure
- Meta tags for social sharing
- Open Graph tags ready to be added
- Mobile-responsive design

## License

© 2026 TRAK. Open source under MIT License.
