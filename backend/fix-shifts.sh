#!/bin/bash
# Fix alle Shift creations - füge location hinzu

sed -i "s/      requiredQualifications: \[/      location: 'Haupteingang',\n      requiredQualifications: [/g" src/utils/seedShiftPlanningV2.ts

echo "✅ Alle Shifts gefixed!"
