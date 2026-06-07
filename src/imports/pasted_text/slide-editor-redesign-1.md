I need to completely redesign the Preview Builder screen. The current 
version is confusing because it overlaps with the Presentation screen 
(both just show previews in different layouts). I need a clear 
separation of roles:

- Preview Builder = the designer's workspace (organize, edit structure)
- Presentation = the final delivery view for clients

NEW CONCEPT — SLIDE EDITOR (like Google Slides):

The Builder should work as a slide editor where each slide has a 
specific type and purpose. Slides are auto-generated from the 
uploaded folder structure (Client → Campaign → Platform → Format) 
and the user edits content inline.

SLIDE TYPES:

1. COVER SLIDE — The general campaign cover (inherited from the 
   Cover & Branding step). Shows logo, campaign title, client name, 
   review round, and shipping date.

2. SECTION INTRO SLIDE — A divider slide that introduces each 
   platform section (Meta, Display, YouTube, etc.). Centered layout 
   with platform name, big title, and subtitle. Both title and 
   subtitle are editable inline.

3. PIECES SLIDE — The most important one. Layout: legal column on 
   the LEFT (1/3 width), pieces grid on the RIGHT (2/3 width). 
   The left column shows for each piece: a "◇ Legales" header (with 
   a small violet diamond icon), an editable textarea with the legal 
   text, and a violet pill with the product brand (LG, Lenovo, etc). 
   The right column shows each piece with: an editable name on top 
   (e.g. "Meta_1080x1080"), a placeholder image with the correct 
   aspect ratio, and an editable title at the bottom.

AUTO-SPLIT BEHAVIOR:
When a platform has too many pieces to fit comfortably in one slide, 
the system automatically splits them into multiple "Pieces 1/2", 
"Pieces 2/2" slides based on piece dimensions. The user does NOT 
configure this manually — show it as automatic.

LAYOUT STRUCTURE:

┌─ TOP BAR ─────────────────────────────────────────────┐
│  [☰ Menu] [← Back]  Client › Campaign  ⚡ Auto-organized  
│                              [Zoom][Reset][Present][Share]
├─────────┬──────────────────────────┬──────────────────┤
│         │                          │                  │
│ SLIDES  │   SLIDE EDITOR          │   PROPERTIES     │
│ TREE    │   (large canvas)         │   (contextual)   │
│         │                          │                  │
└─────────┴──────────────────────────┴──────────────────┘

NAVIGATION MENU (NEW):
Add a hamburger/menu button on the far left of the top bar (before 
the Back arrow). When clicked, it opens a slide-in side menu (or a 
dropdown) with these options:
- 🏠 Dashboard
- 📁 Campaigns
- ⚙️ Settings
- ❓ Help
- (divider)
- User info at the bottom (avatar + name + role)

This menu lets the user navigate back to the dashboard or other 
sections without losing context. Use a smooth slide-in animation 
(200ms) from the left.

LEFT PANEL — SLIDES TREE:
Width: 256px. Header: "Slides" with total count badge.

Tree structure:
- Cover slide at the top (numbered "1")
- Then collapsible platform groups, each with:
  - Platform name + colored dot (Meta=blue #1877F2, Display=blue 
    #4285F4, YouTube=red #FF0000)
  - Count of slides inside
  - Nested slides indented with a left border
  - Each nested slide shows its number, type label ("Intro" / 
    "Pieces 1/2") and a small subtitle (the slide title)
- Selected slide: dark background (bg-gray-900) with white text
- Bottom: "+ Add slide" dashed button

CENTER — SLIDE EDITOR:
Background: #F1F3F4 (soft gray, like Google Slides).
Top breadcrumb: "Slide X of Y › [slide type label]"
Canvas: aspect-video white card with shadow, max-width 4xl, scaling 
with zoom level.

Each slide type renders differently:
- Cover: large padding, logo top-left, big title bottom-left, 
  separator line, client + date metadata
- Section Intro: centered vertically, decorative lines on sides, 
  platform label in uppercase tracking-wide, editable title (36px) 
  and subtitle (14px)
- Pieces: split layout as described above (legal LEFT 1/3, grid RIGHT 
  2/3), pieces grid auto-adjusts columns (1 piece = 1 col, 2 pieces 
  = 2 cols, 3+ pieces = 3 cols)

Smooth fade+slide transition when changing slides (200ms).

RIGHT PANEL — PROPERTIES (contextual):
Width: 256px. Header: "Properties · [Platform name if applicable]"
Content changes based on selected slide type:

If COVER selected:
- "SLIDE INFO": Type, Position
- "NOTE": Small gray card saying "Cover content is inherited from 
  Campaign Setup. To edit, go back to Cover & Branding."
- "ACTIONS": Duplicate, Reorder, Delete

If SECTION INTRO selected:
- "SECTION INFO": Platform, Type (Intro slide), Position
- "SECTION TEXT": editable Title and Subtitle inputs
- "ACTIONS": Duplicate, Reorder, Delete

If PIECES selected:
- "SLIDE INFO": Platform, Pieces count, Position, Part (if split)
- "LAYOUT": Legal side (Left, read-only), Pieces grid (Auto with 
  zap icon)
- "AUTO-SPLIT": Gray info card explaining the auto-split logic
- "ACTIONS": Duplicate, Reorder, Delete

All sections use uppercase 10px tracking-wider gray labels.
Smooth fade transition when switching between panel states (180ms).

TOP BAR DETAILS:
- Menu button (hamburger) on far left
- Back arrow next to it
- Breadcrumb: Client name (gray) › Campaign name (medium gray)
- Vertical divider
- "⚡ Auto-organized from folder" subtle text (reinforces the 
  product promise)
- Right side: zoom control (- 100% +), reset button, divider, 
  "Present" outline button, "Share" dark filled button

REMOVE FROM THE PREVIOUS VERSION:
- The Assets/Layers tab system in the left panel
- The grid-based canvas (3 columns of preview cards)
- Manual layout controls (Gap, Padding, Radius)
- Template selector in the right panel (already in Cover & Branding)
- Branding section in the right panel (already in Cover & Branding)
- Background selector in the right panel (already in Cover & Branding)
- Smart Organize section
- Device switcher (Desktop/Tablet/Mobile) in the top bar — not 
  relevant for slide editing

DEMO DATA (use for the prototype):
Create 8 demo slides:
1. Cover (Q3 Brand Refresh · Acme Corp)
2. Meta · Intro
3. Meta · Pieces 1/2 (2 square pieces with LG brand)
4. Meta · Pieces 2/2 (2 tall pieces with LG brand)
5. Display · Intro
6. Display · Pieces (1 tall + 1 wide, LG brand)
7. YouTube · Intro
8. YouTube · Pieces (1 tall piece, Lenovo brand)

Each piece has: name (e.g. "Meta_1080x1080"), dimensions, brand 
pill, an editable legal textarea, and an editable title field. 
Legal text uses real Spanish legal copy format (e.g. "Válido del 24 
/ Abr. / al 7 / May. / 2026. Tarjeta Éxito Mastercard emitida 
por la Compañía de Financiamiento TUYA S.A.").

VISUAL STYLE:
Keep the same minimal aesthetic as the rest of the project:
- White panels, gray-50 canvas background
- Neutral grays, black for primary actions
- Borders: gray-100 and gray-200
- Rounded corners: rounded-lg, rounded-xl, rounded-2xl
- Section labels: uppercase, tracking-wider, 10px, gray-400
- Smooth motion/react transitions (180-200ms)

COMPONENT PROPS:
- onBack: () => void
- onPresent: () => void
- onShare: () => void
- campaign: CampaignState (has campaignName, clientName, brandColor, 
  reviewRound, shippingDate, etc.)

KEY UX PRINCIPLES:
- Builder = workspace, Presentation = final view
- Reinforce automation: "Auto-organized", "Auto-split", "Auto grid"
- All structural decisions are automatic — the user only edits 
  content (titles, legal text, piece names)
- Slide tree mirrors folder structure: Client → Campaign → Platform 
  → Slides
- Side menu provides escape hatch back to Dashboard at any time