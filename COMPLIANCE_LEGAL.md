# GramMate: Compliance & Legal Framework
## Regulatory Requirements, Risk Mitigation, and Operations

**Version:** 1.0  
**Jurisdiction(s):** US, Canada, UK (MVP); EU, APAC (V1+)

---

## 1. Data Privacy & Protection

### 1.1 GDPR Compliance (EU Users)

**Applicability:** Trigger when EU users ≥5% of MAU or ≥1M aggregate (expand scope as grows)

**Key Requirements:**

| Requirement | GramMate Implementation |
|---|---|
| **Data Processing Agreement (DPA)** | Stripe, AWS, SendGrid, Plaid must sign DPA before processing EU user data |
| **Privacy Policy (clear lang)** | Data collection: emails, views, engagements, bank info, IP; Retention: 30 days logs, 3 yrs transaction history |
| **Right to Deletion** | User can request account deletion; system purges PII within 30 days; content deletion within 90 days |
| **Right to Rectification** | User can edit profile data via Settings; email/address via support ticket |
| **Right to Withdraw Consent** | Checkbox for marketing emails (separate from transactional); easy unsubscribe link |
| **Lawful Basis** | Contract (payout fulfillment) + consent (marketing) + legitimate interest (fraud prevention) |
| **Transfers Outside EU** | Data transfers to US require Standard Contractual Clauses (SCCs); AWS/Stripe sign SCCs |
| **Sub-processor list** | Published on website; any change notified 30 days in advance |
| **Breach notification** | Internal incident response within 72 hours; notify affected users + DPA authority if required |
| **DPIA (for high-risk processing)** | Required if using ML for decisions (not MVP, defer to V1); privacy impact assessment completed |

**Operational checklist:**
- [ ] Privacy policy drafted (lawyer review)
- [ ] DPA templates prepared (share with vendors)
- [ ] Data retention policy coded (automated purge jobs)
- [ ] Consent management system (Segment/Twilio if needed)
- [ ] Breach response playbook written
- [ ] Sub-processor list maintained on website

---

### 1.2 CCPA Compliance (California Users)

**Applicability:** Triggers at any time (applies even with 1 CA user if CA resident)

**Key Requirements:**

| Right | Implementation |
|---|---|
| **Right to Know** | User can request all data collected; export as JSON in 45 days |
| **Right to Delete** | User request → purge within 45 days (except for fraud/legal holds) |
| **Right to Opt-Out** | "Do Not Sell My Personal Info" link in footer; user opts out of data sales |
| **Right to Non-Discrimination** | If user opts-out, must not charge higher fees or change service; GramMate: no discrimination (earn rates same) |
| **Sensitive data disclosure** | Extra notification if using SSN, bank account, health (not applicable MVP) |
| **Notice at collection** | Privacy policy linked at signup; must be clear |
| **Opt-out mechanism** | Visible link (popup or footer), no more than 2 clicks to opt-out |

**Operational checklist:**
- [ ] Privacy policy includes CCPA disclosures
- [ ] Opt-out mechanism built in Settings
- [ ] Data export feature (JSON dump of user data)
- [ ] Deletion job queuing (respects fraud hold timelines)
- [ ] Annual CCPA audit

---

### 1.3 Canada PIPEDA

**Applicability:** All Canadian users

**Key Requirements:**
- Consent for data collection (checkboxes at signup)
- Purpose limiting (only use data for stated purposes)
- Accuracy maintenance
- Right to access
- Right to correction
- 30-day response time to requests

**Implementation:** Largely covers under Privacy Policy; no separate technical changes from GDPR/CCPA.

---

## 2. Financial Regulations

### 2.1 Money Transmission Licensing (US)

**Question:** Does GramMate need money transmitter license?

**Analysis:**
- **Serviced definition (FinCEN):** Money transmitter = accepts cash/funds and returns them later (or elsewhere)
- **GramMate model (non-custodial):**
  * MVP: Stripe processes payouts → funds go directly to user bank account
  * Platform doesn't hold user funds (non-custodial)
  * Wallet balance is a ledger entry, not a segregated account
- **Conclusion:** NOT a money transmitter if using this model
- **If we pivot to custodial wallet:** Would need licenses in each state (~50 states, $100K–$500K each = major cost); defer to V2+

**Stripe compliance:** Stripe is licensed money transmitter; handles state licensing on our behalf (as sub-merchant).

**State-by-state nuances:**
- New York: Requires "BitLicense" if dealing in virtual currencies; avoided by staying fiat-only initially
- Texas: Requires transmitter license if holding funds; non-custodial avoids this
- California: Money transmitter licensing via DFPI; Stripe coverage sufficient

**Operational checklist:**
- [ ] Stripe MSA reviewed by legal counsel
- [ ] Stripe compliance documentation filed
- [ ] Payout flows documented (non-custodial design confirmed)
- [ ] No state-by-state applications needed (unless pivot post-MVP)

---

### 2.2 KYC/AML (Anti-Money Laundering)

**Applicability:** US creators earning >$600/year (IRS 1099 threshold); global expansion adds complexity

**Requirements:**

| Tier | KYC Level | Annual Limit | Triggered by |
|---|---|---|---|
| **Tier 1** | Email verified | $500 earnings | Signup |
| **Tier 2** | Email + SMS verified | $20K earnings | Automatic at 100-day threshold |
| **Tier 3** | Government ID + SSN (US) | Unlimited | Manual review; required for Tier 2 overflow |

**Verification process:**
- **Email verification:** Confirmation link, no cost
- **SMS verification:** OTP via Twilio
- **Government ID:** Stripe Identity verification (photo of ID, liveness check), <1 min, cost $0.10
- **SSN validation:** Stripe KYC integration with ID verification, cost $0.20

**SAR Filing (Suspicious Activity Report):**
- If user shows signs of money laundering (rapid deposits, structured deposits, international transfers), file with FinCEN
- Rule: File if transaction >$5K + suspicious pattern detected
- GramMate ML flagging: Duplicate account patterns, velocity anomalies, BNP (beneficial owner) mismatches

**Operational checklist:**
- [ ] Stripe Identity configured for KYC
- [ ] Payout tier system coded
- [ ] AML monitoring dashboard built (Stripe alerts + custom ML)
- [ ] SAR filing procedure documented
- [ ] Annual AML audit

---

## 3. Tax Compliance

### 3.1 Creator Tax Reporting (US)

**Threshold:** Creators earning >$600/year in US

**Compliance:**
- GramMate generates 1099-NEC (Non-employee compensation)
- Filed with IRS by January 31 (for prior year earnings)
- Sent to creator by January 31
- Creator's tax obligation: Report on Schedule C (self-employment income)

**Implementation:**
- Stripe Reports API → extract annual earnings per creator
- Integrate with 1099 generation vendor (Stripe Tax or third-party)
- Mail/email to creators

**Operational requirement:**
- [ ] Name + SSN collected from top creators (>$600 threshold)
- [ ] 1099 generation system integrated
- [ ] Annual filing job scheduled (Jan 31 deadline)

### 3.2 Viewer Earnings Tax (edge case)

**Question:** Are viewer micro-rewards (e.g., $0.015 per view) taxable?

**IRS position:** Technically yes (any income); practically no (amounts too small, not tracked)

**GramMate approach:** Treat as "sweepstakes/incentive" earnings, not reportable at viewer level (<$600). If viewer withdrawals > $20K annually (edge case), document in payout records but don't file 1099 (since we don't have individual view data from platform integration).

---

### 3.3 International Creator Taxation (complex; V1+ consideration)

**China creators:** None; GramMate not operational in China (Great Firewall blocks)

**EU creators:** 
- Each country has different rules (Germany: freelance GST rules, France: individual entrepreneur rules)
- Solution for MVP: Defer to creator's accountant; we provide payout records + 1099 equivalent
- Post-MVP: Implement per-country tax docs

**India creators:**
- Income ≥₹400K annually triggers TDS (Tax Deducted at Source)
- Our responsibility: Deduct 10–20% at payout, remit to Indian tax authority
- Implementation: Add to payout logic; flagging for India vs. other countries

---

## 4. Content Policy & DMCA

### 4.1 Copyright Infringement (DMCA)

**Safe Harbor (17 USC 512):**
- GramMate has safe harbor IF:
  1. Platform has clear DMCA takedown procedures
  2. Responds to takedown notices within reasonable time (<72 hours)
  3. No actual knowledge of infringement
  4. Takedown request meets statutory requirements

**Implementation:**
- "Report Copyright" form on each video (legal@grammate.com)
- Takedown request must include:
  * Creator's identity
  * Works allegedly infringed
  * Statements under penalty of perjury
  * Signature (physical or digital)
  * Contact info
- On receipt:
  * Acknowledge within 24 hours
  * Remove/disable video within 72 hours if request valid
  * Notify creator (counter-notice process)
  * If counter-notice, restore within 10 business days (unless legal action commenced)

**Creator responsibilities:**
- Creator warrants content is original or authorized to post
- Creator indemnifies GramMate against DMCA claims
- Repeated infringement → account suspension

**Operational checklist:**
- [ ] DMCA takedown form built (contact form + email)
- [ ] Legal responses template (acknowledge, 72-hour timeline)
- [ ] Creator notification workflow (takedown alerts)
- [ ] Counter-notice process documented
- [ ] Video removal job (soft-delete flag + hard-delete after disputes)

---

### 4.2 Content Policy Violations

**Categories:**
1. **Child Safety (CSAM):** Zero tolerance, immediate reporting to NCMEC
2. **Sexual Content:** Nudity, NSFW allowed (SFW tags); explicit incest/bestiality removed
3. **Violence:** Graphic injury, animal cruelty, threats of violence removed
4. **Hate Speech:** Slurs, dehumanization removed; political speech allowed
5. **Self-harm:** Suicide, cutting content removed; mental health resources linked
6. **Misinformation:** Medical claims (cures for diseases), election fraud, vaccine danger removed
7. **Spam:** Duplicate content, artificial engagement, malware links removed
8. **Harassment:** Targeted abuse, misgendering, doxxing removed; naming/shaming allowed if factual
9. **Copyright/IP:** DMCA handled separately; fanworks generally allowed

**Appeal Process:**
- User can appeal removal by clicking "Appeal" in notification
- Submitted to human review queue
- Decision within 48 hours
- No further appeals (final)

**Operational checklist:**
- [ ] Content policy document (public)
- [ ] Enforcement playbook (which team/tools for each category)
- [ ] NCMEC reporting integration (CSAM reports auto-sent)
- [ ] Appeal system built
- [ ] Moderator training program

---

## 5. Consumer Protection & Fraud Prevention

### 5.1 FTC Endorsement Guidelines

**Applicable when:** Creators are paid to promote products (brand deals)

**Requirements:**
- Sponsored content clearly labeled ("Sponsored" or "#ad" visible)
- No false or misleading earnings claims (e.g., "Everyone earns $10K" if not typical)
- Material connections disclosed

**GramMate implementation:**
- Brand marketplace (V1) requires "#ad" or "Sponsored" in video title/description
- Creator attestation: "I disclose all sponsored content" in ToS
- Automated check: Flag videos with brand mention but no #ad tag

---

### 5.2 Chargeback & Fraud Prevention

**Chargeback risk:** User earns $100 via engagement, withdraws → then disputes with payment processor ("I didn't authorize this")

**Prevention:**
- KYC verification (identity matched to bank account name)
- Email verification (account security baseline)
- 30-day hold on withdrawals (allows disputes to surface)
- Transaction hashing (audit trail of engagements → payout)

**Chargeback response:**
- Stripe handles dispute resolution (GramMate provides evidence: engagement logs)
- If disputed withdrawal valid: Evidence of engagement proves service rendered
- If fraudulent payout (e.g., bot view inflation): Debit creator's account, reverse payout

**Operational checklist:**
- [ ] Chargeback response playbook (evidence gathering)
- [ ] Hold logic in payout system (30-day grace)
- [ ] KYC integration (identity verification)
- [ ] Dispute flags (velocity anomalies, geographic impossible travel)

---

## 6. Accessibility (ADA + WCAG)

**Applicability:** US website + App (legal requirement under ADA; good practice globally)

**WCAG 2.1 Level AA requirements:**
- Alt text for all images/videos (thumbnails need description)
- Keyboard navigable (app: VoiceOver on iOS, TalkBack on Android)
- Color contrast ratio 4.5:1 for text (readability)
- Captions for videos (accessibility + engagement)
- Form labels + error messages
- Skip links (web version)

**MVP scope:**
- [ ] Alt text for thumbnails + avatars
- [ ] Keyboard navigation (iOS/Android native support)
- [ ] Color contrast audit (Lighthouse, WebAIM)
- [ ] Skip links on web (if PWA built)
- [ ] Manual VoiceOver testing (basic flows)

**Post-MVP:** Captions (auto-generated via AWS Transcribe or AssemblyAI), extended testing

---

## 7. Child Safety (COPPA)

**Applicability:** If any users <13 years old

**COPPA Requirements (US):**
- Age gate: Require ≥13 confirmation at signup
- No direct messaging from users <13 to strangers
- Limited data collection from <13 (no behavioral tracking/ML)
- Parental consent for <13 (complex; most apps just block <13)

**GramMate approach:**
- Age gate: "You must be 13+" checkbox (self-attested; no ID verification)
- For users <18: No DMs from non-followers (friend-only messaging)
- No targeted advertising to <13 (if enforced age gate)
- Content restriction: Videos from creators >18 can be marked "18+" (parental control)

**Operational checklist:**
- [ ] Age gate at signup
- [ ] Age stored in database
- [ ] Messaging rules (age-based)
- [ ] <18 advertising restrictions
- [ ] COPPA ToS addendum
- [ ] Annual COPPA compliance audit

---

## 8. Accessibility for International Expansion

### 8.1 China (Not Applicable)

- **Decision:** No plans to launch in mainland China (Great Firewall, regulatory hostility)

### 8.2 India

**Key regulations:**
- IT Rules 2021 (data localization, content takedown timelines)
- Data Protection Bill (when enacted; similar to GDPR)
- Income Tax Act (TDS withholding on payments >₹500)

**Requirements:**
- [ ] Data stored in India (AWS Mumbai region)
- [ ] 36-hour takedown response time for government requests
- [ ] TDS calculations (10–20% withholding on creator payouts)
- [ ] RBI compliance (payment processor licensed)

**Implementation timeline:** M14–18 (post-MVP expansion)

### 8.3 EU (Germany, France, Spain)

**Key regulations:**
- GDPR (covered above)
- Digital Services Act (platform responsibility for illegal content)
- VAT/GST (platform collects tax on creator payouts)

**Requirements:**
- [ ] VAT registration per country
- [ ] VAT calculation on creator earnings (varies: DE 19%, FR 20%, ES 21%)
- [ ] 24-hour takedown response (DSA)
- [ ] Transparency reporting (annual)

**Implementation timeline:** M10–12 (post-MVP expansion)

---

## 9. Insurance & Risk Management

**Recommended coverage:**

| Insurance | Coverage | Annual Cost |
|---|---|---|
| **General Liability** | Slip/fall, basic injuries | $5K–$15K |
| **Cyber Liability** | Data breach, ransomware, legal costs | $50K–$100K |
| **Employment Practices** | Wrongful termination, discrimination | $30K–$50K |
| **Professional Liability (E&O)** | Errors, omissions, misadvice | $30K–$75K |
| **Directors & Officers (D&O)** | Board liability | $50K–$150K |
| **Errors & Omissions (Product)** | App failures, compensation claims | $25K–$50K |
| **Total annual cost** | **~$190K–$440K** |

---

## 10. Legal Documents Checklist

**Required for launch:**

- [ ] **Terms of Service**
  - Content guidelines, account termination, indemnification
  - Dispute resolution (binding arbitration)
  - Limitation of liability

- [ ] **Privacy Policy**
  - Data collection, uses, retention
  - Third-party integrations (Stripe, Plaid, AWS)
  - GDPR/CCPA/PIPEDA-compliant disclosures

- [ ] **Community Guidelines**
  - Content categories (prohibited vs. allowed)
  - Enforcement (removal, suspension, appeals)

- [ ] **Creator Agreement**
  - Revenue share (20% platform cut)
  - Payout terms (weekly ACH)
  - IP rights (creator owns content)
  - Indemnification (creator warrants original content)

- [ ] **DMCA Takedown Procedure**
  - How to report, response timeline
  - Counter-notice process

- [ ] **Accessibility Statement**
  - WCAG 2.1 AA commitment
  - Known limitations
  - Contact for accessibility issues

- [ ] **Cookies & Tracking Disclosure**
  - Google Analytics, mixpanel, session tracking
  - Opt-out options

**Optional but recommended:**

- [ ] **Vulnerability Disclosure Policy** (security.txt)
- [ ] **Whistleblower Policy** (internal)
- [ ] **Trademark Guidelines** (brand protection)
- [ ] **Affiliate/Referral Program Terms** (if applicable)

---

## 11. Ongoing Compliance Operations

**Monthly:**
- [ ] Review new user reports (CSAM, extreme violence)
- [ ] Chargeback dispute response
- [ ] Payout error review

**Quarterly:**
- [ ] SAR filing review (AML check)
- [ ] Policy updates (alignment with platform changes)
- [ ] Compliance audit (checklist completion)

**Annually:**
- [ ] 1099 filing (Jan 31 deadline)
- [ ] Tax compliance review
- [ ] Insurance renewal
- [ ] External audit (SOC 2 Type II)
- [ ] Legal review (ToS, Privacy, Guidelines)
- [ ] GDPR/CCPA audit

---

**Status:** Legal framework complete | **Next Step:** Engage external counsel for document review & finalization

