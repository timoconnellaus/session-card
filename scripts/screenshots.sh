#!/bin/bash
# Retake the README images (docs/images) and the 20 example cards (docs/examples) from the gallery.
# Needs Google Chrome and ImageMagick. Starts its own static server on port 8931.
set -u
cd "$(dirname "$0")/.."
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
python3 -m http.server 8931 --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

# shot INDEX MODE WIDTH NAME EXTRA SET OUTDIR
# Headless Chrome writes the image within a couple of seconds and then sometimes hangs, so each try
# is cut off after 8s, and each try gets its own profile so a killed one can't lock the next.
shot() {
  local ok=""
  for try in 1 2 3; do
    local out="$TMP/$4-$try.png"
    timeout 8 "$CH" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
      --force-device-scale-factor=2 --virtual-time-budget=5000 --window-size="$3",2600 \
      --user-data-dir="$TMP/p-$4-$try" --screenshot="$out" \
      "http://127.0.0.1:8931/gallery/index.html?set=$6&only=$1&mode=$2$5" >/dev/null 2>&1
    if [ -s "$out" ]; then ok="$out"; break; fi
  done
  if [ -z "$ok" ]; then echo "FAILED $4"; return; fi
  local bg='#1F1E1D'; [ "$2" = light ] && bg='#F5F4EE'
  magick "$ok" -fuzz 2% -trim +repage -bordercolor "$bg" -border 32 -resize '1400x>' "$7/$4.png"
  echo "ok $4"
}

examples=(01-quick-answer 02-one-thing-to-try 03-one-decision 04-blocked-on-a-key 05-claude-carries-on 06-all-done
  07-back-from-a-break 08-ship-check 09-ready-for-review 10-device-test-report 11-what-first 12-end-of-day
  13-lots-to-do 14-progress 15-tests-failing 16-approve-a-plan 17-describe-a-bug 18-deploy-running
  19-progress-since-last-look 20-long-lists-fold)
for i in "${!examples[@]}"; do shot "$i" dark 736 "${examples[$i]}" "" more docs/examples; done
shot 1 light 736 02-one-thing-to-try-light "" more docs/examples
shot 7 light 736 08-ship-check-light "" more docs/examples
shot 1 dark 440 02-one-thing-to-try-phone "&w=phone" more docs/examples
shot 12 dark 440 13-lots-to-do-phone "&w=phone" more docs/examples

readme=(your-turn back-from-a-break progress-track scoreboard ship-check ready-for-review questions report-and-reorder all-done)
for i in "${!readme[@]}"; do shot "$i" dark 736 "${readme[$i]}" "" examples docs/images; done
shot 0 light 736 your-turn-light "" examples docs/images
shot 0 dark 440 your-turn-phone "&w=phone" examples docs/images
echo DONE
