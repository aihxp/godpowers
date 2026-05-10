# @godpowers/launch-pack

Channel-specific launch strategists for Godpowers.

## What it adds

| Slash command | Agent | What it knows |
|---|---|---|
| `/god-show-hn` | god-show-hn-strategist | HN title conventions, body norms, timing, anti-cringe |
| `/god-product-hunt` | god-product-hunt-strategist | Tagline, gallery, hunters, 12:01 AM PT timing |
| `/god-indie-hackers` | god-indie-hackers-strategist | Numbers-first, mistakes, real questions |
| `/god-oss-release` | god-oss-release-strategist | README, SemVer, examples that run |

Plus 4 workflows and 22 channel-specific have-nots.

## When to use

- After `/god-launch` (core) for channel-specific tactics
- For OSS libraries: `/god-oss-release` then `/god-show-hn`
- For B2C SaaS: `/god-product-hunt` + `/god-indie-hackers`
- For developer tools: `/god-show-hn` first, others as fits

## Install (v0.8+)

```
/god-extension-add @godpowers/launch-pack
```

## Status

Scaffold ready in v0.4. Full implementation arrives in v0.8 alongside the
extension loader.

## License

MIT
