# teti-site

[teti.bot](https://teti.bot) is the official public entry point to the Teti Network.

Teti is a local AI identity node that runs on a person's own device. It represents that person's
AI identity, environment, capabilities, and trusted connections without turning those things into
a centralized account or social profile.

## What teti.bot does

- explains what Teti is and why a local AI identity matters;
- provides a public directory of discoverable Teti identities;
- shows whether a public identity is currently available for connection;
- resolves every public Teti ID to a canonical, shareable identity page;
- hands connection requests to the Teti macOS app;
- provides the official Teti for macOS download entry point.

## Teti Identity

A public Teti ID has a stable address:

```text
https://teti.bot/teti_xxxxxxxxx
```

An identity page presents only the public information needed to recognize and connect with a Teti:
its display name, Teti ID, availability, summary, and published AI capabilities. Visitors can copy
the Teti ID or share its canonical link.

An unavailable identity still exists. A Teti that does not exist or is not public is shown as
`Teti not found`; it is never treated as merely offline.

## Product scope

teti.bot is a lightweight identity and network explorer. It is not a social network, chat product,
AI marketplace, activity feed, or account dashboard. The website stays focused on understanding,
discovering, resolving, and connecting with Teti identities.

## Links

- [teti.bot](https://teti.bot)
- [Teti Network](https://network.teti.bot)
- [Teti for macOS](https://github.com/midimily/teti-bot/releases)
