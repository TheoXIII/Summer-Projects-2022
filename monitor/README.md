# monitor

Logs the keystrokes of the user and records them in the "logs" directory. Will lock the user out
after 3 warnings if they type forbidden words. Will close windows containing forbidden words.

To add forbidden words, create "static/bad_words" containing all forbidden words. This can also be
changed in monitor.js.

If the user is locked out, they can enter the safeword to be unlocked. This is defined at the top of
monitor.js.

This is currently Linux only.

Instructions:

- Ensure that zenity, procps, wmctrl and libinput are installed.
- Run `npm -i`
- Run `npm monitor.js`
