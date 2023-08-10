# SPDX JSON File Viewer

Allows you to view and filter SPDX files locally (even if you open it in the browser)

## Local Usage 

Clone this repository and run it in a webserver. If you don't have one, use `npx http-server` or something similar to boot it up.

## Customise

### Search in other fields

Change the `field` attribute to the field name of the spdx file you're interested in. Only top-level fields from `.packages.[]` supported atm

Example - search licenses

```html
<spdx-search field="licenseDeclared"></spdx-search>
```

### Filter by other fields

Change the `field` attribute to the field name of the spdx file you're interested in. Only top-level fields from `.packages.[]` supported atm

Example - search names

```html
<spdx-filter field="name"></spdx-filter>
```

### Show other fields in table

Change the `column` attribute to a comma separeted list of fields you're interested in. Only top-level fields from `.packages.[]` supported atm

Example - Show name and originator

```html
<spdx-table columns="name,originator"></spdx-table>
```
