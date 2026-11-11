export const explainers = {
  "cheese-generation": {
    project: "The Cheese Prophecy", number: "01", title: "A sentence hidden in plain sight.",
    summary: "Follow an oracle phrase from its word pool to the holes that reveal it.",
    steps: [
      { label: "Choose", title: "The prophecy comes first.", text: "One phrase is randomly selected from the oracle’s collection. In this example: ‘Trust the path you cannot see’." },
      { label: "Scatter", title: "Its words disappear into a crowd.", text: "The phrase is placed, in reading order, among 120–159 filler words. The visible text keeps shuffling until you invoke the oracle." },
      { label: "Reveal", title: "The holes make a sentence visible.", text: "The shuffle stops. An SVG cheese mask places a hole over each target word, turning a field of text into a readable prophecy." },
      { label: "Keep", title: "A fleeting reading becomes a card.", text: "The revealed phrase can be exported as a 1080 × 1350 PNG, together with the cheese composition and the project’s QR code." },
    ],
  },
  "cheese-revelation": {
    project: "The Cheese Prophecy", number: "02", title: "The geometry behind the holes.",
    summary: "A closer look at the sequence behind a single invocation.",
    notes: [
      { label: "Position", text: "Each cross marks the centre of a target word in the rendered text." },
      { label: "Radius", text: "The word’s dimensions determine the size of its circular cut-out." },
      { label: "Reading order", text: "The target words retain the order of the original phrase." },
      { label: "Mask", text: "These circles become holes in the cheese-shaped SVG overlay." },
    ],
    steps: [
      { label: "Shuffle", title: "The surface is constantly changing.", text: "While the oracle waits, unlocked words are replaced at roughly 80 ms intervals. The selected phrase remains stored beneath this changing surface." },
      { label: "Stop", title: "The text settles in a cascade.", text: "Invoking the oracle locks the words one after another over about 250 ms, restoring the prepared word pool." },
      { label: "Locate", title: "The system finds the hidden words.", text: "Each word of the prophecy is located in the rendered text. Its on-screen position and size determine the centre and radius of a hole." },
      { label: "Unveil", title: "A mask turns positions into meaning.", text: "The cheese appears over the text with cut-outs aligned to the phrase. Extra decorative holes keep the form irregular; the prophecy is shown alongside it." },
    ],
  },
  "cheese-interface": {
    project: "The Cheese Prophecy", number: "03", title: "One gesture. Two ways to read it.",
    summary: "The interface connects an unfolding visual ritual with a collectable result.",
    notes: [
      { label: "Invoke", text: "One action freezes the moving word field and reveals the mask." },
      { label: "Reveal", text: "The left side presents the phrase through the cheese holes." },
      { label: "Read", text: "The right side repeats the revealed phrase as clear text." },
      { label: "Keep or restart", text: "Save the card, or begin again with a new prophecy." },
    ],
    steps: [
      { label: "Enter", title: "An invitation to consult the oracle.", text: "The title and a single primary action introduce the experiment. The moving word field is ready before the first click." },
      { label: "Invoke", title: "The word field becomes the stage.", text: "‘Find the Prophecy’ freezes the text and reveals the cheese mask. The composition on the left carries the visual reading." },
      { label: "Read", title: "The same phrase gets a second voice.", text: "A separate text area presents the prophecy clearly, alongside the masked words. The visual event and its reading remain connected." },
      { label: "Continue", title: "Keep this reading, or begin another.", text: "Download Card exports the current composition. New prophecy clears the result, selects another phrase and restarts the shuffle." },
    ],
  },
  "dream-pipeline": {
    project: "Dream Catalogue", number: "01", title: "A record becomes a constellation.",
    summary: "See how individual dream records become an explorable network.",
    steps: [
      { label: "Record", title: "Every point begins with a dream.", text: "The archive loads structured records from dreams.json. Each entry holds a title, date, qualitative attributes and numerical measures." },
      { label: "Compare", title: "One chosen attribute makes the links.", text: "Dreams are compared by mood, objects, setting, people or perspective. A link is created when they share at least one value in the selected category." },
      { label: "Arrange", title: "Relationships shape the map.", text: "A D3 force simulation balances link attraction, repulsion, centring and collision. The chosen metric controls each node’s radius." },
      { label: "Explore", title: "The map leads back to the record.", text: "Selecting a node highlights its neighbours and opens its details. The network offers a different way into the same dream archive." },
    ],
  },
  "dream-forces": {
    project: "Dream Catalogue", number: "02", title: "Connections pull. Dreams make space.",
    summary: "Isolate the forces that let a dream network find its shape.",
    notes: [
      { label: "Size", text: "Radius = 5 + metric × 0.18. Choose importance, weirdness or memory." },
      { label: "Attraction", text: "Shared attributes form links that pull connected dreams together." },
      { label: "Separation", text: "Repulsion and collision leave space around each dream." },
      { label: "Balance", text: "Centring and radial forces keep the constellation together." },
    ],
    steps: [
      { label: "Size", title: "A metric gives each dream its scale.", text: "Importance, weirdness or memory sets the radius: 5 + metric × 0.18. Size encodes the selected measure, rather than the number of connections." },
      { label: "Attract", title: "Shared attributes pull dreams together.", text: "Link weight is the number of shared values. A heavier link has a shorter target distance and a stronger attraction." },
      { label: "Separate", title: "Repulsion leaves room to read.", text: "Many-body repulsion spreads the nodes. Collision adds a buffer around each circle, while centring and radial forces keep the network together." },
      { label: "Settle", title: "The forces resolve into a constellation.", text: "As the simulation cools, movement settles. Changing the connection category or size measure recalculates the relevant relationships or radii." },
    ],
  },
  "dream-interface": {
    project: "Dream Catalogue", number: "03", title: "Change the lens. Follow a dream.",
    summary: "A guided reading of the archive’s filters, map and detail panel.",
    notes: [
      { label: "Context", text: "The header shows the entry count and language switch." },
      { label: "Lens", text: "Filters choose what connects dreams and what sets their size." },
      { label: "Map", text: "Pan, zoom and select a dream to highlight its neighbours." },
      { label: "Record", text: "The detail panel shows its measures, attributes and connections." },
    ],
    steps: [
      { label: "Orient", title: "The header gives the archive context.", text: "The entry count reflects the loaded dataset. A language switch changes the interface between Italian and English." },
      { label: "Connect", title: "Filters change what a line means.", text: "Connect by chooses the attribute used for links. Size chooses which numerical measure determines the node radius." },
      { label: "Select", title: "One dream brings its neighbours forward.", text: "Selecting a point highlights its connected dreams. You can pan and zoom the map to explore a different part of the archive." },
      { label: "Inspect", title: "The detail panel returns to one experience.", text: "The selected record opens with its title, date, measures, attributes and connected dreams. Close the panel to return to the wider map." },
    ],
  },
} as const;

export type ExplainerKind = keyof typeof explainers;
