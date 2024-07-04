let card = false; // Initialisierung der `card`-Variablen
let rows = []; // Globale Variable, um die Daten zu speichern
let chart = null; // Variable, um das Chart-Objekt zu speichern
let barChart = null; // Variable, um das BarChart-Objekt zu speichern

document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    setupTooltip();
    setupSlider();
});

function moveOut() {
    card = true;
    let cardElement = document.getElementById("card");
    cardElement.style.transform = "translateX(-100%)";
    console.log("Out");
}

function moveIn(BL) {
    let cardElement = document.getElementById("card");
    cardElement.style.transform = "translateX(0)";
    document.getElementById("cardname").innerHTML = BL;

    // Suchen Sie das ausgewählte Bundesland
    const selectedData = rows.find(d => d.name === BL);
    if (selectedData) {
        document.getElementById("flaeche").innerText = selectedData.Flaeche + " km²";
        document.getElementById("entsorgungsanlagen").innerText = selectedData.Abfallentsorgungsanlagen;
        document.getElementById("bevoelkerungsdichte").innerText = selectedData.Bevoelkerungsdichte;
    }

    card = false;
    console.log("In");
}


function toggleCard(BL) {
    if (!card) {
        moveIn(BL);
        card = true; // Setze den Kartenstatus auf "eingefahren"
    } else {
        if (document.getElementById("cardname").innerHTML === BL) {
            moveOut();
            card = false; // Setze den Kartenstatus auf "ausgefahren"
        } else {
            moveOut();
            setTimeout(() => {
                moveIn(BL);
                card = true; // Setze den Kartenstatus auf "eingefahren" nach einer Verzögerung
            }, 200); // 500ms Timeout, um die Übergangszeit abzustimmen
        }
    }
    pieChart(rows, BL);
}

async function fetchData() {
    const response = await fetch("Entsorgung von Abfällen - Bundesländer.csv");
    const data = await response.text();

    // Split the data by new lines, remove the header and the last empty line
    rows = data.split("\n").slice(5, -1).map(elt => {
        const row = elt.split(",").map(col => col.replace(/"/g, '').trim());

        // Combine thousand-separated numbers
        const combineNumber = (arr, idx) => parseFloat(arr[idx] + '.' + arr[idx + 1]);

        return {
            name: row[0],
            Abfallentsorgungsanlagen: parseInt(row[1]),
            InputVonEntsorgung: combineNumber(row, 2),
            ImEigenenBetrieb: combineNumber(row, 4),
            Inland: combineNumber(row, 6),
            Ausland: combineNumber(row, 8),
            Bevoelkerungsdichte: parseFloat(row[10].replace(",", ".")),
            Flaeche: parseFloat(row[11].replace(",", "."))
        };
    });

    // Debugging-Ausgabe, um sicherzustellen, dass die Daten korrekt geladen sind
    console.log(rows);

    // Hier sollte die Funktionsaufrufe für createHeatmap und createBarChart erfolgen
    createHeatmap(rows, 'InputVonEntsorgung');
    createBarChart(rows, 'InputVonEntsorgung');
}

function createBarChart(data, dataType) {
    const ctx = document.getElementById('barChart').getContext('2d');

    // Sortiere die Daten absteigend basierend auf dem angegebenen dataType
    data.sort((a, b) => b[dataType] - a[dataType]);

    // Extrahiere sortierte Werte für den Chart
    const sortedValues = data.map(d => d[dataType]);

    // Extrahiere sortierte Labels für den Chart
    const labels = data.map(d => d.name);

    // Debugging-Ausgabe, um sicherzustellen, dass Labels und Daten korrekt sind
    console.log("Sorted Labels:", labels);
    console.log("Sorted Values:", sortedValues);

    // Zerstöre das alte Chart-Objekt, falls es existiert
    if (barChart) {
        barChart.destroy();
    }

    // Erstelle den neuen Chart
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Abfallentsorgung (${dataType})`,
                data: sortedValues,
                backgroundColor: 'rgba(64, 165, 120, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function setupTooltip() {
    const tooltip = document.getElementById('tooltip');
    document.querySelectorAll('.map path').forEach(element => {
        element.addEventListener('mousemove', (event) => {
            tooltip.style.display = 'block';
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
            tooltip.innerHTML = element.getAttribute('data-name') + '<br>' + 'Insgesamt: ' + element.getAttribute('data-value') + " /1000 t";
        });
        element.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });
    });
}

function createHeatmap(data, dataType) {
    const maxValue = Math.max(...data.map(d => d[dataType]));
    const minValue = Math.min(...data.map(d => d[dataType]));
    function interpolateColor(value) {
        const startColor = [200, 222, 139];
        const endColor = [61, 139, 39];
        const differenz = maxValue - minValue;
        const factor = (value - minValue) / differenz;
        const interpolate = (start, end, factor) => Math.round(start + (end - start) * factor);
        const r = interpolate(startColor[0], endColor[0], factor);
        const g = interpolate(startColor[1], endColor[1], factor);
        const b = interpolate(startColor[2], endColor[2], factor);
        return `rgb(${r},${g},${b})`;
    }

    data.forEach(d => {
        const idMap = {
            "Baden-Württemberg": "DE-BW",
            "Bayern": "DE-BY",
            "Berlin": "DE-BE",
            "Brandenburg": "DE-BB",
            "Bremen": "DE-HB",
            "Hamburg": "DE-HH",
            "Hessen": "DE-HE",
            "Mecklenburg-Vorpommern": "DE-MV",
            "Niedersachsen": "DE-NI",
            "Nordrhein-Westfalen": "DE-NW",
            "Rheinland-Pfalz": "DE-RP",
            "Saarland": "DE-SL",
            "Sachsen": "DE-SN",
            "Sachsen-Anhalt": "DE-ST",
            "Schleswig-Holstein": "DE-SH",
            "Thüringen": "DE-TH"
        };

        const elementId = idMap[d.name];
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                const color = interpolateColor(d[dataType]);
                element.style.fill = color;
                element.setAttribute('data-name', d.name);
                element.setAttribute('data-value', d[dataType]);
            } else {
                console.error(`Element mit ID ${elementId} nicht gefunden.`);
            }
        } else {
            console.error(`Keine passende ID für das Bundesland ${d.name} gefunden.`);
        }
    });

    // Event-Listener für Klickereignisse auf jedes Bundesland
    document.querySelectorAll('.map path').forEach(element => {
        element.addEventListener('click', () => {
            console.log(card)
            const Bundesland = element.getAttribute('data-name');
            toggleCard(Bundesland); // Aufruf der toggleCard-Funktion mit dem ausgewählten Bundesland
        });
    });
}

// Funktion zum Erstellen des Pie-Charts für ein bestimmtes Bundesland
function pieChart(data, Bundesland) {
    console.log("Piechart");
    // Finde die Daten für das ausgewählte Bundesland
    const selectedData = data.find(d => d.name === Bundesland);

    // Überprüfen, ob Daten für das ausgewählte Bundesland gefunden wurden
    if (selectedData) {
        console.log(selectedData); // Überprüfen der Daten im Konsolen-Log

        // Holen Sie sich das Canvas-Element und den Kontext
        var chrt = document.getElementById("chartId").getContext("2d");

        // Wenn bereits ein Chart existiert, zerstöre es
        if (chart) {
            chart.destroy();
        }

        // Erstellen Sie den Pie-Chart
        chart = new Chart(chrt, {
            type: 'pie',
            data: {
                labels: ["Ausland", "Inland", "Im eigenen Betrieb"],
                datasets: [{
                    label: Bundesland,
                    data: [
                        selectedData.Ausland,
                        selectedData.Inland,
                        selectedData.ImEigenenBetrieb,
                    ],
                    backgroundColor: ['aqua', 'yellow', 'pink'],
                    hoverOffset: 5
                }],
            },
            options: {
                responsive: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                let value = tooltipItem.raw;
                                if (value === 0) {
                                    return 'Keine Daten';
                                }
                                return tooltipItem.label + ': ' + value;
                            }
                        }
                    }
                }
            },
        });
    } else {
        console.error(`Daten für das Bundesland ${Bundesland} nicht gefunden.`);
    }
}

function setupSlider() {
    const slider = document.getElementById('dataTypeSlider');
    const label = document.getElementById('dataTypeLabel');

    slider.addEventListener('input', function () {
        const dataTypes = ['InputVonEntsorgung', 'Ausland', 'Inland', 'ImEigenenBetrieb', 'Bevoelkerungsdichte', 'Abfallentsorgungsanlagen'];
        const labels = ['Input', 'Ausland', 'Inland', 'Im eigenen Betrieb', 'Bevölkerungsdichte', 'Abfallentsorgungsanlagen'];

        const selectedType = dataTypes[this.value];
        const selectedLabel = labels[this.value];

        label.textContent = selectedLabel;

        createHeatmap(rows, selectedType);
        createBarChart(rows, selectedType);
    });
}


