function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseColorsFromUrl(url) {
    if (!url || url.trim() === '') return null;

    try {
        const parts = url.split('/');
        const colorPart = parts[parts.length - 1];
        const colors = colorPart.split('-').map(c => '#' + c);
        return colors.length > 0 ? colors : null;
    } catch (e) {
        console.error('Error parsing Coolors URL:', e);
        return null;
    }
}

function getColorScheme() {
    const coolorsUrl = document.getElementById('coolorsUrl').value;
    const colorsFromUrl = parseColorsFromUrl(coolorsUrl);

    if (colorsFromUrl) {
        return colorsFromUrl;
    }

    const colorInputs = document.querySelectorAll('#colorInputs input[type="color"]');
    return Array.from(colorInputs).map(input => input.value);
}

function getRandomHexColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}
