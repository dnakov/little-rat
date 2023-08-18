VER=$1
DIST=build/chrome
rm -rf $DIST
mkdir -p $DIST

if [ ! -z "$VER" ]; then
  jq --arg VER "$VER" '.version = $VER | .optional_permissions = [ "declarativeNetRequestFeedback", "management" ] | .permissions = .permissions - ["management", "declarativeNetRequestFeedback"]' manifest.json > $DIST/manifest.json
else
  cp manifest.json $DIST/manifest.json
fi

cp -r src $DIST/src
mkdir -p $DIST/assets
cp assets/little-rat-* $DIST/assets
zip little-rat.zip -qr $DIST/*