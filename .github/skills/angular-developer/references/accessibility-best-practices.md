# Accessibility Best Practices

Use this reference when reviewing or improving accessibility in this workspace. Prioritize WCAG 2.1 and 2.2 alignment, semantic HTML, keyboard access, assistive technology support, and incremental changes that fit the current implementation.

## How To Use This Reference

- Start with the concrete UI being changed: template, interaction model, styles, and any existing tests.
- Recommend the smallest change that improves the user experience for keyboard and assistive technology users.
- Explain why the change matters.
- Prefer semantic HTML first, then ARIA only when necessary.

## Structure And Semantics

A well-structured page helps screen readers and other assistive tools understand the interface.

- Use semantic elements such as `header`, `nav`, `main`, `footer`, `button`, `form`, and `label` instead of generic containers.
- Keep heading levels in order.
- Use landmarks so users can jump through the page efficiently.
- Ensure interactive controls have an accessible name.

Example:

Bad:

```html
<div onclick="submitForm()">Submit</div>
```

Better:

```html
<button type="submit">Submit</button>
```

## Keyboard Navigation

All functionality must work without a mouse.

- Preserve a logical tab order that matches the visual flow.
- Ensure custom interactive elements can receive focus and respond to keyboard input.
- Provide a skip link when repeated navigation is significant.
- Avoid keyboard traps in dialogs, menus, and composite widgets.

Example:

Bad:

```html
<div class="menu-item">Menu</div>
```

Better:

```html
<div class="menu-item" role="button" tabindex="0">Menu</div>
```

## ARIA

Use ARIA to supplement native HTML, not to replace it.

- Prefer native controls before adding roles.
- Keep ARIA states such as `aria-expanded`, `aria-selected`, and `aria-checked` synchronized with UI state.
- Use `aria-live` only for updates that must be announced.

Example:

Bad:

```html
<button>Menu</button>
<ul class="dropdown">
  ...
</ul>
```

Better:

```html
<button aria-expanded="false" aria-controls="dropdown">Menu</button>
<ul id="dropdown" hidden>
  ...
</ul>
```

## Forms And Inputs

Accessible forms need proper labels, descriptions, and error association.

- Use explicit labels.
- Connect help text and validation errors with `aria-describedby` when appropriate.
- Use `fieldset` and `legend` for related control groups.
- Do not rely on placeholders as labels.

Example:

Bad:

```html
<input type="email" placeholder="Enter your email" />
```

Better:

```html
<label for="email">Email address</label>
<input type="email" id="email" aria-describedby="email-help" />
<span id="email-help">We will never share your email.</span>
```

## Color And Contrast

Good contrast and redundant cues are required for low-vision and color-blind users.

- Meet WCAG contrast thresholds.
- Do not communicate state using color alone.
- Ensure focus indicators are visible against the background.

Example:

Bad:

```html
<span style="color: red;">Error</span>
```

Better:

```html
<span style="color: red;">Warning: please try again</span>
```

## Multimedia

- Provide meaningful `alt` text for informative images.
- Use empty `alt` text for decorative images.
- Provide captions or transcripts for audio and video.
- Use descriptive link text.

Example:

Bad:

```html
<img src="chart.png" />
```

Better:

```html
<img src="chart.png" alt="Bar chart showing Q1 sales growth by 20 percent" />
```

## Dynamic Content And Widgets

When content updates without a page reload, users still need clear announcements and focus handling.

- Move focus into dialogs when they open and restore it when they close.
- Use `aria-live` for meaningful async updates when focus does not move.
- Ensure tabs, menus, carousels, and other widgets work with keyboard interaction patterns.

Example:

Bad:

```html
<div class="modal">...</div>
```

Better:

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Settings</h2>
</div>
```

## Testing Recommendations

Use a mix of automated and manual checks.

- Run AXE or Lighthouse for quick automated coverage.
- Test the relevant flow using only the keyboard.
- Validate with screen readers such as VoiceOver, NVDA, or TalkBack when the interaction is important.
- Include accessibility assertions in browser or e2e tests when the same pattern can regress.

## Performance And Motion

Accessibility and performance often overlap.

- Keep interactions responsive.
- Respect `prefers-reduced-motion`.
- Verify layouts still work when zoomed to 200 percent.

Example:

Bad:

```css
.modal {
  animation: bounce 2s infinite;
}
```

Better:

```css
@media (prefers-reduced-motion: reduce) {
  .modal {
    animation: none;
  }
}
```

## Mobile And Touch

- Keep touch targets large enough to activate reliably.
- Preserve visible focus states for users with keyboards or switch devices.
- Avoid gesture-only actions without a clear alternative.
- Support orientation changes and zoom.

## Useful References

- Angular accessibility best practices: `https://angular.dev/best-practices/a11y`
- WCAG overview: `https://www.w3.org/WAI/standards-guidelines/wcag/`
- ARIA Authoring Practices: `https://www.w3.org/WAI/ARIA/apg/`
- WebAIM resources: `https://webaim.org/resources/`
