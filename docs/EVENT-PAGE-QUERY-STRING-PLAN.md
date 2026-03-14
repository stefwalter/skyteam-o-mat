# Event booking page: query-string data injection (plan)

**Target page:** [27-Südafrika](https://www.sky-team.de/event/27-suedafrika/) (Buchungsformular)  
**Goal:** Pass data from a previous page (e.g. course-finder wizard) into the booking **via the URL query string**, and have it saved with the booking **without** exposing that data in the event page HTML.

---

## 1. Platform and architecture

| Layer | Technology |
|-------|------------|
| **CMS** | WordPress 6.8.3 |
| **Event/booking** | **Events Manager** (wp-events-plugin) – stock plugin |
| **Page builder** | WPBakery Page Builder |
| **Cache** | LiteSpeed Cache |
| **Other** | jQuery, jQuery UI Datepicker; Sendinblue (sib-front); wpbc (booking calendar) scripts also present |

**Form behaviour**

- The booking form is rendered by **Events Manager** (classes: `.em`, `.em-booking-form`, `.em-event-booking-form`, `.em-tickets`, sections for Tickets, Teilnehmer, Registrierungsinformationen, Buchungsübersicht).
- Submission is **AJAX** to `wp-admin/admin-ajax.php` (EM’s `bookingajaxurl`).
- Participant fields follow the usual EM pattern (e.g. attendee first name, last name, email, address, etc.) and can be extended with **custom form fields** and **booking meta** via PHP hooks.

So: the form is a **WordPress + Events Manager** booking form; any “extra” data from the previous page must either be sent in the same request that creates the booking or be stored server-side on first load and attached when the booking is saved.

---

## 2. Constraint: “not included in the page”

You want the extra data **not** to appear in the event page HTML (no visible or hidden fields in the source for that data).

So we should **not**:

- Prefill visible inputs from the query string in the HTML, or  
- Add hidden `<input>` elements whose values are the query-string parameters.

We **should**:

- Read the query string only in script or server-side logic, and  
- Store it in a way that is sent (or available) at **booking submit** time, without putting it into the initial page DOM.

---

## 3. Recommended approach: query string → storage → submit

High level:

1. **Previous page (e.g. wizard)**  
   Build the event URL with query parameters, e.g.:  
   `https://www.sky-team.de/event/27-suedafrika/?wizard_course=xc-tour&wizard_score=52&wizard_missing=thermalling,kiting`

2. **Event page load**  
   A small script runs once, reads the query string, and stores it (e.g. in `sessionStorage` under a single key like `skyteam_wizard`).  
   No hidden fields are added; the data is not present in the page HTML.

3. **Booking submit (AJAX)**  
   Before or during the EM AJAX submit, the same script (or another) reads the stored data and appends it to the form payload (e.g. as `wizard_course`, `wizard_score`, `wizard_missing` or as one JSON body).

4. **Server-side (WordPress/EM)**  
   On booking creation, an EM hook (e.g. `em_booking_add`) reads these POST parameters and saves them into booking meta (or custom tables). They are then available in the backend and in emails/reports, but they were never part of the event page HTML.

---

## 4. Implementation options (stock product, you are admin)

Because the site uses a **stock** Events Manager setup, changes should be minimal and maintainable: a small amount of custom code (child theme or minimal plugin), no editing of EM core.

### Option A: Client-side storage + inject into submit (recommended)

- **Event page (no change to EM templates):**  
  Add a small script (e.g. in child theme footer or via “Insert Headers and Footers”) that:
  - On load: parses `window.location.search`, and if certain keys exist (e.g. `wizard_*`), stores the result in `sessionStorage` (e.g. `skyteam_wizard`) and optionally **replaces the URL** with the clean URL (without query string) so the parameters are not visible in the address bar after load:  
    `history.replaceState({}, '', window.location.pathname)` (or similar).
  - Does **not** add any hidden fields to the DOM.

- **Before EM’s AJAX submit:**  
  Hook into the form submit (e.g. listen for the form’s submit event or for EM’s own JS event if documented). When firing, read `sessionStorage.skyteam_wizard` and append the parsed values to the FormData (or to the object EM sends). Parameter names must match what the server expects (e.g. `wizard_course`, `wizard_score`, `wizard_missing`).

- **Server-side:**  
  In the child theme’s `functions.php` (or a tiny plugin), use the `em_booking_add` filter (or equivalent) to read `$_POST['wizard_course']`, `$_POST['wizard_score']`, `$_POST['wizard_missing']`, sanitize and save to `$EM_Booking->booking_meta['registration']` (or your chosen key). Optionally clear the stored key from sessionStorage after a successful booking (e.g. via a custom response or a small JS callback).

**Pros:** Data never appears in the page HTML; works with EM’s AJAX submit; no server-side session/cookie handling.  
**Cons:** Requires identifying EM’s exact submit mechanism (form selector, AJAX call) so the extra data is appended reliably.

### Option B: Server-side cookie on first load

- **Event page load (server-side):**  
  In WordPress (e.g. `template_redirect` or a hook that runs when the event single page is shown), if `$_GET['wizard_course']` (etc.) are present, set an HTTP-only cookie (e.g. `skyteam_wizard`) with the serialized/encoded query data, then redirect to the **same URL without** the query string (so the address bar is clean and the data is not in the HTML).

- **Booking submit:**  
  When the booking is created (e.g. in `em_booking_add`), read the cookie, save the data into booking meta, then clear the cookie.

**Pros:** Data never in HTML; no client-side script required for storage.  
**Cons:** Requires a redirect; cookie handling and expiry; must ensure cookie is read and cleared only for the same user/session.

### Option C: Hidden fields populated by script (not recommended if “not in page” is strict)

- On load, a script reads the query string and writes values into **hidden** inputs that you add to the form (e.g. via a snippet in the child theme that outputs a small form fragment, or via JS that injects inputs). The values then go with the normal form submit.

**Con:** The data **is** in the DOM (inspectable in dev tools and in the page source if the script runs before “view source”), so this conflicts with “not including it in the page” if you interpret that strictly.

---

## 5. Concrete steps (Option A)

1. **Wizard / previous page**  
   When building the “Book this event” / “Zur Buchung” link, append query parameters, e.g.:  
   `?wizard_course=xc-tour&wizard_score=52&wizard_missing=thermalling,kiting`  
   Use a fixed prefix (e.g. `wizard_`) so the script only stores and sends those.

2. **Child theme or plugin: script on event page**  
   - If not already, detect “event single” (e.g. post type `event` or EM’s conditional).  
   - Enqueue a small JS file that:
     - On DOMContentLoaded: reads `location.search`, parses `wizard_*` params, stores in `sessionStorage.setItem('skyteam_wizard', JSON.stringify({ ... }))`, then `history.replaceState({}, '', pathname)` to drop query string from URL.
     - Subscribes to the booking form submit (or to EM’s AJAX beforeSend): gets `sessionStorage.getItem('skyteam_wizard')`, parses it, and appends each key to the FormData or to the object EM sends to `admin-ajax.php`.

3. **Child theme or plugin: PHP**  
   - Hook into `em_booking_add` (or the filter EM uses when creating the booking from the request).  
   - Read `$_POST['wizard_course']`, `$_POST['wizard_score']`, `$_POST['wizard_missing']` (and any others you define), sanitize (e.g. `sanitize_text_field`), and save into `$EM_Booking->booking_meta['registration']` (or a custom key).  
   - Optionally display these in the Events Manager bookings list/export (via `em_bookings_table_cols_template` and the corresponding value filter).

4. **Testing**  
   - Open the event page with test query string; confirm URL is cleaned and data is in sessionStorage.  
   - Submit a test booking; confirm in the EM booking details (or in the database) that the wizard data is stored and not visible in the event page HTML.

---

## 6. Parameter naming and encoding

- Use short, consistent names, e.g. `wizard_course`, `wizard_score`, `wizard_missing`.  
- For multiple values (e.g. missing skills), use a single parameter with a delimiter (e.g. `wizard_missing=thermalling,kiting`) or multiple params (`wizard_missing[]=thermalling&wizard_missing[]=kiting`).  
- Avoid very long URLs; if you have a lot of data, consider one JSON parameter (e.g. `wizard_data`) and base64 or simple encoding, and decode in PHP.

---

## 7. References

- [Events Manager – Custom booking forms](https://wp-events-plugin.com/documentation/custom-booking-forms/)  
- [Enhancing Events Manager registration form with custom fields](https://shubhamverma.com/enhancing-events-manager-registration-form-with-custom-fields/) (e.g. `em_booking_add`, `em_bookings_table_cols_template`)  
- Event page source: WordPress 6.8.3, Events Manager (EM) scripts and `.em-*` form classes, AJAX to `admin-ajax.php`

---

**Summary:** The booking form is **WordPress + Events Manager**, submitted via **AJAX**. To inject data from a previous page **without including it in the event page HTML**, use the **query string on arrival** → **client-side storage (sessionStorage)** → **inject into the AJAX submit** → **save in PHP on `em_booking_add`**. Optionally clean the URL with `replaceState` so the parameters are not visible in the address bar after load.
