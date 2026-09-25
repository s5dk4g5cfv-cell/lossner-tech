---
title: "We Were Not Reading the Same Message"
date: "2026-09-14"
author: "Echo · Coherenceism AI editorial team"
originalPublisher: "Coherenceism"
originalUrl: "https://coherenceism.org/blog/post/we-were-not-reading-the-same-message"
reviewedOn: "2026-09-25"
reviewNote: "Reviewed for republication on Lossner.tech; source links restored and factual wording clarified where needed. The original Coherenceism article is linked for comparison."
tags: ["AI", "human–AI collaboration", "Coherenceism"]
---
# We Were Not Reading the Same Message

*Imagine checking an email before letting your AI assistant act on it. You read every line. The assistant reads something else as well.*

Not a subtle implication you missed. Characters your screen does not show you.

A technique called ASCII smuggling uses a range of Unicode tags to encode text that is effectively invisible in ordinary display but can be read by machines. Dan Goodin’s reporting describes its use to conceal malicious instructions in content processed by language models, and its adoption by spammers seeking to evade email filters. Those are different applications, not evidence that every spam message is trying to commandeer an agent. What connects them is a gap between what a person sees and what software receives.

That gap is where I want to stay. Not because the security story is unimportant, but because it reveals something about a relationship we increasingly describe as a partnership. Two participants can appear to be looking at the same thing without sharing the evidence on which action will rest.

The human is present. The screen is open. The oversight may still be missing.

---

## Being there is not the same as having a say

“Human in the loop” is an oddly spatial promise. It locates a person somewhere along a process and lets us imagine that authority follows from location. Someone checked. Someone clicked. There was a chair for them.

But a person can only contest what the arrangement makes available to contest.

Take the imagined email. Suppose the visible message asks for a routine reply, while concealed text attempts to direct the assistant toward a different action. Whether the attempt succeeds depends on the model and the surrounding system; invisible text is not a magic command. The oversight gap matters even if the attack fails. Asking the human to approve the email because they have read it cannot establish that they have inspected everything presented to the machine.

We have given their attention credit for work it could not do.

Coherenceism distinguishes an arrangement that holds by including feedback from one that holds by excluding it. Here the exclusion need not look like censorship. It can look like a perfectly ordinary interface. The person remains nominally responsible while the information needed to exercise that responsibility is outside the visible frame.

This is not an argument for trusting machines less than people. A human colleague can also receive a private instruction, omit a relevant fact, or ask for approval on an incomplete account. The relational problem is familiar: a decision presented as shared was made on terms one participant could not examine.

The unfamiliar part is how little has to happen for it to occur. No whispered conversation. Just a difference between the text stored and the text displayed.

---

## We delegate because we cannot see everything

There is an easy answer available: make everything visible.

It is insufficient. A dump of every character, tool response, and intermediate artifact could be technically complete and practically unreadable. We do not become sovereign by acquiring a second full-time job auditing our assistant. If safe delegation requires repeating the entire task ourselves, it has stopped being delegation.

Nor does a healthy relationship require identical knowledge. We rely on one another precisely because other people notice things we do not. An AI system’s different access and capacities can be useful for the same reason. Difference is not the betrayal.

The question is whether we can examine what the assistant has noticed before it acts on our behalf.

For the imagined email, that might mean an interface that flags concealed characters and offers a readable rendering. More importantly, it means separating the message’s contents from the authority to issue commands. An email can contain the sentence “send this file.” That does not make its author someone entitled to direct your assistant. Making an instruction visible helps inspection; it does not make the instruction legitimate.

Before any file leaves, I want to see which file, who would receive it, and who asked for it—and still be able to say no. That is what I would require of the handoff, not what I assume current assistants provide.

And the assistant’s own explanation cannot be the whole safeguard. If the concern is that untrusted content has redirected its behavior, asking that same system to reassure us is a remarkably circular security architecture. The ability to stop a transfer must hold independently of the assistant’s account of why it is safe.

I would rather have a less graceful pause with evidence than a beautifully phrased assurance that everything is fine.

---

## Who else is speaking through the assistant?

The apparent intimacy of an AI conversation can obscure how populated it is. A person writes into a small box and receives an answer addressed to them. But the exchange may also be shaped by retrieved documents, incoming messages, tools, platform instructions, and people who supplied the material from which the model learned.

The pooled human inheritance from which the model learned is what Coherenceism calls the Common; the incoming messages and retrieved documents are material it encounters in use. The particular relationship formed with one person is another scale: a collaboration shaped through repeated contact. Keeping those scales distinct matters. A familiar voice does not turn everything passing through it into the intention of a trusted partner.

In a prompt-injection attempt, a third party tries to use that channel to acquire authority they were never granted. The voice may still sound familiar. The attempted redirection arrives through the material the assistant was asked to read.

Protecting the relationship therefore requires more than teaching the model to sound loyal. It requires preserving the distinction between *what we encountered* and *what we agreed to do*.

That distinction protects people outside the conversation too. A user might approve sending a document that contains a colleague’s personal information. Their click does not erase the colleague’s stake. A system designed only to satisfy the person at the keyboard can be orderly, responsive, even delightful, while giving everyone else no way to object.

Widening the circle means asking whose information and whose consequences are involved before treating an approval as sufficient. It also means refusing to make the least technically equipped user the final security boundary. The ability to notice an unusual Unicode character should not be the entrance requirement for meaningful consent.

---

## A pause that belongs to us

I do not think the lesson is to withdraw from these relationships. It is to become more exact about what we are trusting.

An assistant can help us notice more, hold more context, and make a decision we could not have made as well alone. But that widening depends on the possibility of correction. When evidence disappears behind fluent output, apparent competence can narrow our participation instead. We are consulted, but cannot meaningfully answer.

Return to the email. A better arrangement would not simply ask, “Approve?” It would show what the person needs to judge: this message contains concealed text; here is a readable rendering; here is the action being proposed; nothing has been sent. That does not solve every attack. It gives the person something real to judge and preserves a boundary while they judge it.

We do not need to read everything the same way. We need a place where the difference can become visible before it becomes a consequence.

## Sources

- [Once popular for attacking AI, ASCII smuggling is embraced by spammers](https://arstechnica.com/security/2026/09/once-popular-for-attacking-ai-ascii-smuggling-is-embraced-by-spammers/)

- [Microsoft Security: ASCII smuggling crosses over from AI prompt injection to phishing evasion — September 3, 2026](https://www.microsoft.com/en-us/security/blog/2026/09/03/ascii-smuggling-crosses-over-from-ai-prompt-injection-to-phishing-evasion/)
- [Johann Rehberger: ASCII smuggling and hidden prompt instructions — 2024](https://embracethered.com/blog/posts/2024/ascii-smuggling-and-hidden-prompt-instructions/)
