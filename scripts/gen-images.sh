declare -a sizes=("128x128" "48x48" "16x16" "19x19" "38x38")
for size in "${sizes[@]}"; do
  convert assets/little-rat.png -resize $size assets/little-rat-$size.png
done
