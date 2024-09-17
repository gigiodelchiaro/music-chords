document.addEventListener('DOMContentLoaded', function () {
    const chordDropdown = document.getElementById('chordDropdown');
    const newChordButton = document.getElementById('newChordButton');
    const fileInput = document.getElementById('fileInput');

    function updateChordOptions() {
        chordDropdown.innerHTML = '<option value="">Select a chord</option>';
        for (const chordName in chordDict) {
            const option = document.createElement('option');
            option.value = chordName;
            option.textContent = chordName;
            chordDropdown.appendChild(option);
        }
    }

    fileInput.addEventListener('change', function () {
        setTimeout(updateChordOptions, 100);
    });

    chordDropdown.addEventListener('change', updateChordDisplay);

    newChordButton.addEventListener('click', function () {
        const chordName = prompt('Enter a name for the new chord:');
        if (chordName && chordName.trim() !== '') {
            chordDict[chordName] = new Chord(chordName, '', [], []);
            const newOption = document.createElement('option');
            newOption.value = chordName;
            newOption.textContent = chordName;
            chordDropdown.appendChild(newOption);
            chordDropdown.value = chordName;
            chordDropdown.dispatchEvent(new Event('change'));
        }
    });

    let start = null;
    let end = null;
    document.addEventListener('mousedown', function(event1) {
        start = event1.target;
    });

    document.addEventListener('mouseup', function(event2) {
        end = event2.target;
        if (start.classList.contains('preview') && end.classList.contains('preview')) {
            const selectedChord = chordDropdown.value;
            if (start === end) {
                const circle = start;
                const zCoord = prompt('Enter the z coordinate:');
                if (zCoord !== null) {
                    chordDict[selectedChord].shape += `, (${circle.getAttribute('x_coord')}, ${circle.getAttribute('y_coord')}, ${zCoord})`;
                }
            } else {
                const x1 = parseInt(start.getAttribute('x_coord'));
                const x2 = parseInt(end.getAttribute('x_coord'));
                const smallestX = Math.min(x1, x2);
                const biggestX = Math.max(x1, x2);
                chordDict[selectedChord].shape += `, (${smallestX}-${biggestX}, ${start.getAttribute('y_coord')})`;
            }
            const rhythmType = document.getElementById('sambaToggle').checked ? 'samba' : 'default';
            updateChordGridAndCSS(selectedChord, rhythmType);
        }
    });

    ['cellWidth', 'cellHeight', 'radius', 'stroke', 'smallRadius'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateResultJSON);
    });

    updateResultJSON();
});

function updateChordDisplay() {
    const selectedChord = chordDropdown.value;
    const rhythmType = document.getElementById('sambaToggle').checked ? 'samba' : 'default';
    updateChordGridAndCSS(selectedChord, rhythmType);
}

function updateChordGridAndCSS(selectedChord, rhythmType, preview = true) {
    drawChordGrid(chordDict[selectedChord], document.getElementsByClassName('svgElement')[0], rhythmType, preview);
    update_css(
        parseInt(document.getElementById('cellWidth').value),
        parseInt(document.getElementById('cellHeight').value),
        parseInt(document.getElementById('stroke').value),
        parseInt(document.getElementById('smallRadius').value),
        parseInt(document.getElementById('radius').value)
    );
    updateResultJSON();
}
function render(preview = false, del = false) {
    const selectedChord = chordDropdown.value;
    const rhythmType = document.getElementById('sambaToggle').checked ? 'samba' : 'default';
    const svgElement = document.getElementsByClassName('svgElement')[0];

    drawChordGrid(
        chordDict[selectedChord],
        svgElement,
        rhythmType,
        preview
    );
   
    if (del){

        document.removeEventListener('mousedown', deleteElement);
        document.addEventListener('mousedown', deleteElement, { once: true });
    }

    updateChordGridAndCSS(selectedChord, rhythmType, preview);    
}

function deleteElement(event) {
    const selectedChord = chordDropdown.value;
    const element = event.target;
    if (element.tagName.toLowerCase() === 'circle' || element.classList.contains('finger')) {
        const regex = new RegExp(`\\(${element.getAttribute('x_coord')},\\s*${element.getAttribute('y_coord')},\\s*\\w+\\)`);
        chordDict[selectedChord].shape = chordDict[selectedChord].shape.replace(regex, '');
    } else if (element.tagName.toLowerCase() === 'line') {
        const x1 = parseInt(element.getAttribute('x_coord1'));
        const x2 = parseInt(element.getAttribute('x_coord2'));
        const smallestX = Math.min(x1, x2);
        const biggestX = Math.max(x1, x2);
        const regex = new RegExp(`\\(${smallestX}-${biggestX},\\s*${element.getAttribute('y_coord')}\\)`);
        chordDict[selectedChord].shape = chordDict[selectedChord].shape.replace(regex, '');
    }
    const rhythmType = document.getElementById('sambaToggle').checked ? 'samba' : 'default';
    updateChordGridAndCSS(selectedChord, rhythmType, false);
}
function updateResultJSON() {
    const result = {
        "style": {
            "cellWidth": parseInt(document.getElementById('cellWidth').value),
            "cellHeight": parseInt(document.getElementById('cellHeight').value),
            "radius": parseInt(document.getElementById('radius').value),
            "stroke": parseInt(document.getElementById('stroke').value),
            "smallRadius": parseInt(document.getElementById('smallRadius').value)
        },
        "chords": Object.values(chordDict).map(chord => ({
            "name": chord.name,
            "shape": chord.shape,
            "essential": chord.essential,
            "exclude": chord.exclude
        }))
    };

    document.getElementById('resultJSON').value = JSON.stringify(result, null, 2);
}
function downloadJSON() {
    const content = document.getElementById('resultJSON').value;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chords.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}