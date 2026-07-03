import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════════
   SCREAMING SIRENS — Paramedic Edition · Ch 47 (Pediatrics)
   Single-file React component. Built to the v2.1 design spec.
   The whole unit renders as a casino-grade slot cabinet dressed as the
   front of an ambulance: backlit marquee lightbox, LED light-bar pod,
   three reel panes as premium glass windshields inside a brushed-metal
   cab, a chrome-collared mechanical RESPOND button, and the run-sheet
   card recessed into the body between gloss-black chevron rails.
   Slot-cadence presentation, skill-only rewards: the Star of Life lights
   exclusively on a correct answer. No chance element, no dark patterns.
   Session-only state (React hooks); no localStorage/sessionStorage.
   All art is CSS + inline SVG — no raster assets.
   ════════════════════════════════════════════════════════════════════════ */

/* ══════════════════ APPROVED QUESTION BANK ══════════════════
   The 100 records below are transferred verbatim (machine-converted
   and character-audited against the source file) from the approved
   "Module 2 — Chapter 47 (Pediatrics): 100-Question Practice Bank"
   (the vetted 63-question exam + the 50-question quiz). Per spec §3.1
   (Source fidelity) nothing is generated, reworded, or paraphrased;
   content only ever changes by swapping in an updated approved bank.

   Format, one record per line:

     category ||| question ||| optionA ||| optionB ||| optionC ||| optionD ||| answerIndex ||| explanation

   - answerIndex is 0-based into the ORIGINAL option order; options are
     shuffled at runtime and the correct index is re-mapped (spec §7).
   - Category codes: dev anat vitals assess airway resp upper lower
     shock pals neuro gimet tox trauma sids abuse */
const RAW_BANK = `
dev ||| Unlike adults, children most commonly progress to cardiac arrest because of: ||| A primary cardiac dysrhythmia ||| Respiratory failure that leads to hypoxia ||| Sudden electrolyte shifts ||| A congenital heart defect ||| 1 ||| Pediatric arrest is usually respiratory in origin — airway and breathing failure cause hypoxia, then arrest. Fix the airway and breathing first.
dev ||| When approaching a frightened toddler (1 to 3 years), the best technique is to: ||| Separate the child from the caregiver right away ||| Approach slowly, use simple words, examine toe-to-head, and allow a comfort object ||| Begin at the head and work down quickly ||| Use detailed medical explanations ||| 1 ||| Toddlers do best with a slow approach, simple words, a toe-to-head exam, and a transitional (comfort) object, with the caregiver close.
dev ||| A "neonate" is correctly defined as an infant who is: ||| In only the first hours after birth ||| From birth to 1 month of age ||| From 1 month to 1 year ||| From 1 to 3 years ||| 1 ||| Newborn = the first hours after birth; neonate = birth to 1 month; infant = 1 month to 1 year.
dev ||| A “neonate” is best defined as an infant from: ||| Birth to the first hour of life ||| Birth to 1 month of age ||| 1 month to 1 year of age ||| Birth to 1 year of age ||| 1 ||| Newborn = the first hours after birth; neonate = birth to 1 month; infant = 1 month to 1 year. The terms aren't interchangeable on an exam.
dev ||| You're assessing an 8-month-old with a fever. Which approach best fits this stage of development? ||| Question the child directly, then confirm details with the parent ||| Examine head-to-toe quickly while the child lies on the cot ||| Examine toe-to-head while the infant stays on the caregiver's lap ||| Separate the child from the parent to reduce distraction ||| 2 ||| 6–12 month infants have strong stranger anxiety. Keep them on the caregiver's lap and work toe-to-head so you don't trigger a meltdown by going for the face first. Direct questioning works for preschoolers and up.
dev ||| Which statement about approaching a preschooler (3–5 years) is most accurate? ||| They can't give useful information, so question only the parents ||| Baby talk puts them at ease and builds rapport ||| They have vivid imaginations, so avoid frightening or misleading comments ||| Modesty isn't a concern until school age ||| 2 ||| Preschoolers have vivid imaginations and real fears. Avoid misleading or frightening comments, question the child first, skip the baby talk, and let them handle a piece of equipment to build trust.
anat ||| The narrowest part of a young child's airway is the: ||| Glottic opening ||| Cricoid ring ||| Oropharynx ||| Carina ||| 1 ||| In children the cricoid ring (cricoid cartilage) is the narrowest part of the airway.
anat ||| To open the airway of a child under age 3, you often need to: ||| Hyperextend the neck ||| Place padding under the torso/shoulders to offset the large occiput and keep the neck neutral ||| Place padding under the head only ||| Flex the neck forward ||| 1 ||| The proportionally large occiput flexes the neck when the child is supine; padding under the torso restores a neutral airway. Over age 3, pad under the occiput for the sniffing position.
anat ||| Compared with an adult, an infant's epiglottis is: ||| Flat and rigid ||| Floppy and omega- or horseshoe-shaped ||| Absent until age 2 ||| Calcified ||| 1 ||| Infants have a floppy, omega/horseshoe-shaped epiglottis; a straight (Miller) blade lifts it directly during intubation.
anat ||| Newborns are described as "obligate nose breathers," which means: ||| They can never breathe through the mouth ||| They breathe primarily through the nose, so a blocked nose can obstruct breathing ||| They breathe only through the mouth ||| They lack a diaphragm ||| 1 ||| Newborns breathe primarily through the nose and may not open the mouth if the nose is blocked, so keep the nares clear.
anat ||| Because pediatric ribs are soft and pliable, significant internal injury can occur: ||| Only when ribs are visibly fractured ||| Without external signs and without rib fractures ||| Only in the abdomen ||| Almost never in children ||| 1 ||| Flexible ribs transmit force to the organs, so serious internal injury can occur with no external signs or rib fractures; the lungs are easily damaged.
anat ||| Why do you pad under the back and shoulders (not the head) to open the airway of a child under 3? ||| Their tongue is smaller and tends to fall back ||| The large occiput flexes the neck forward when they lie supine ||| Their trachea is rigid and needs extension to stay open ||| To compensate for a small, recessed mandible ||| 1 ||| The proportionally large occiput flexes the neck when the child is supine. Padding the torso/shoulders restores a neutral airway. Over age 3, you pad under the occiput instead, to reach the sniffing position.
anat ||| An infant in respiratory distress has a congested, blocked nose. Why is clearing the nares a priority? ||| Infants are physically unable to cough ||| Infants are obligate nose breathers ||| The nasal passages are the narrowest part of the airway ||| Mouth breathing causes gastric distention ||| 1 ||| Infants are obligate nose breathers — a blocked nose alone significantly impairs breathing, so suction and keep the nares clear. (The cricoid ring, not the nose, is the narrowest part of a young child's airway.)
anat ||| A child takes blunt force to the abdomen. Why are pediatric abdominal organs more vulnerable to serious injury than an adult's? ||| The abdominal wall musculature is thicker ||| The liver and spleen are proportionately larger and less protected ||| Children have more subcutaneous fat cushioning the abdomen ||| The pelvis fully shields the lower abdominal organs ||| 1 ||| The liver and spleen are proportionately larger, sit closer together, and the pliable ribs protect them poorly — so significant force causes organ injury and life-threatening internal hemorrhage.
anat ||| A child in major trauma has a normal blood pressure and a heart rate of 165. The most accurate interpretation is: ||| The child is stable because the blood pressure is normal ||| The tachycardia is just fear and can be disregarded ||| The child may be in shock — tachycardia is early and BP is maintained until late ||| Hypotension would have appeared before tachycardia in a child ||| 2 ||| Children vasoconstrict efficiently and hold their pressure until they suddenly crash, so hypotension is a late, ominous sign. Tachycardia is an early clue. Assess shock by perfusion, never by waiting for the BP to fall.
vitals ||| A normal heart rate range for a newborn is approximately: ||| 60 to 100/min ||| 100 to 180/min ||| 180 to 220/min ||| 40 to 60/min ||| 1 ||| Newborn heart rate is about 100 to 180/min — rates are faster the younger the child.
vitals ||| The formula to estimate a child's normal systolic blood pressure is: ||| 70 + (age in years) ||| 90 + (2 × age in years) ||| 100 + (2 × age in years) ||| 80 × (age in years) ||| 1 ||| The pediatric quick-reference estimates normal systolic pressure as 90 + (2 × age in years).
vitals ||| In a sick child, which respiratory finding is the OMINOUS, late sign? ||| A rising respiratory rate (tachypnea) ||| A slowing rate progressing toward bradypnea ||| Pink mucous membranes ||| Symmetric chest rise ||| 1 ||| A rising rate (tachypnea) is the early warning; a slowing rate or bradypnea signals fatigue and impending arrest.
vitals ||| Which range is the best general estimate of a normal resting heart rate for a newborn? ||| 60–100 ||| 80–110 ||| 100–180 ||| 140–220 ||| 2 ||| Newborn heart rate runs roughly 100–180. Ranges decline with age (toddler ≈80–110, school-age ≈65–110). A sustained rate of 220+ suggests SVT, not sinus tachycardia.
vitals ||| A reasonable field formula to estimate a child's normal systolic blood pressure is: ||| 90 + (2 × age in years) ||| 70 + (age in years) ||| 100 + (age in years) ||| 80 × (2 + age in years) ||| 0 ||| The pediatric quick-reference gives a normal systolic of about 90 + (2 × age in years).
assess ||| The three sides of the Pediatric Assessment Triangle (PAT) are: ||| Airway, Breathing, Circulation ||| Appearance, Work of Breathing, and Circulation to the skin ||| Pulse, Blood pressure, Respirations ||| AVPU, GCS, and capillary refill ||| 1 ||| The PAT is a hands-off general impression: Appearance, Work of Breathing, and Circulation to the skin.
assess ||| All of the following indicate increased work of breathing EXCEPT: ||| Nasal flaring ||| Retractions ||| Grunting ||| Slow, effortless, regular breathing ||| 3 ||| Flaring, retractions, grunting, and head bobbing show increased work of breathing; effortless regular breathing is normal.
assess ||| The three sides of the Pediatric Assessment Triangle are: ||| Airway, Breathing, Circulation ||| Appearance, Work of Breathing, Circulation to the skin ||| Alertness, Vital signs, Skin color ||| Pulse, Respirations, Blood pressure ||| 1 ||| The PAT is Appearance (mental status and tone), Work of Breathing (rate and effort), and Circulation to the skin (color). It's a sick-vs-not-sick read, distinct from the hands-on ABCs.
airway ||| An oropharyngeal airway (OPA) is inserted in a young child by: ||| Rotating it 180 degrees as in an adult ||| Inserting it directly, tip toward the tongue, with a tongue blade ||| Placing it in a child who still has a gag reflex ||| Inserting it through the nose ||| 1 ||| In children insert the OPA directly (tip toward the tongue) using a tongue blade, and only when there is no gag reflex.
airway ||| The standard fluid bolus for a child in hypovolemic shock is: ||| 10 mL/kg for every age ||| 20 mL/kg of isotonic fluid (LR or NS), repeatable ||| 60 mL/kg given once ||| 5 mL/kg of D10 ||| 1 ||| Give 20 mL/kg of isotonic fluid (10 mL/kg for a neonate), reassess, and repeat; no improvement after two boluses suggests blood loss needing surgery.
airway ||| The preferred laryngoscope blade for intubating an infant is the: ||| Curved (Macintosh) ||| Straight (Miller) ||| Nasal blade ||| No blade is used ||| 1 ||| A straight (Miller) blade is preferred because it directly lifts the floppy infant epiglottis.
airway ||| Inserting an oropharyngeal airway in a child differs from the adult technique because you should: ||| Insert it rotated 180° and then turn it into position ||| Insert it tip-down toward the tongue and pharynx using a tongue blade ||| Only place it in a patient who has an intact gag reflex ||| Lubricate it and insert it through the nose ||| 1 ||| In children, depress the tongue with a tongue blade and insert the OPA directly, tip toward the tongue/pharynx — not the adult rotation method — and only when there is NO gag reflex.
airway ||| Which device is specifically contraindicated for ventilating pediatric patients? ||| Bag-valve-mask with an oxygen reservoir ||| A flow-restricted, oxygen-powered ventilation device ||| Blow-by oxygen ||| A pediatric-sized nonrebreather mask ||| 1 ||| Flow-restricted, oxygen-powered ventilators are contraindicated in children. Also avoid a bag with a pop-off valve unless the valve can be held closed.
resp ||| The correct order of worsening respiratory compromise is: ||| Arrest, then failure, then distress ||| Distress, then failure, then arrest ||| Failure, then distress, then arrest ||| Distress, then arrest, then failure ||| 1 ||| Respiratory compromise progresses from distress to failure to arrest.
resp ||| Which set of findings indicates respiratory FAILURE rather than distress? ||| Anxiety with hypoxia that improves on oxygen ||| Bradypnea, bradycardia, and central cyanosis ||| Mild tachypnea with good color ||| Clear breath sounds ||| 1 ||| In failure the system can no longer keep up: bradypnea, agonal breathing, bradycardia, central cyanosis, and lethargy.
resp ||| A 3-year-old in respiratory distress should FIRST receive: ||| Immediate intubation ||| Airway positioning and high-concentration oxygen ||| A fluid bolus ||| Chest compressions ||| 1 ||| Start by opening/positioning the airway and giving high-concentration oxygen; use BVM at 100% if breathing is inadequate, and intubate only if BVM does not rapidly improve the child.
resp ||| Which finding most clearly distinguishes respiratory FAILURE from respiratory DISTRESS? ||| Tachypnea with intercostal retractions ||| Nasal flaring in an infant ||| Cyanosis that improves when you give oxygen ||| Central cyanosis with a falling respiratory rate and lethargy ||| 3 ||| Distress = increased work, hypoxia that improves on oxygen, and near-normal-to-anxious mentation. Failure = the system can no longer keep up: lethargy, bradypnea, central cyanosis, and deteriorating vitals.
resp ||| In a deteriorating child, the progression of respiratory compromise runs: ||| Arrest → failure → distress ||| Distress → failure → arrest ||| Failure → distress → arrest ||| Distress → arrest → failure ||| 1 ||| Untreated distress becomes failure, then arrest. The whole point of pediatric assessment is catching the slide early, before failure.
upper ||| A 2-year-old has a harsh, barking, brassy cough that worsened after dark, with inspiratory stridor and a low-grade fever. The most likely diagnosis is: ||| Epiglottitis ||| Croup (laryngotracheobronchitis) ||| Asthma ||| Bronchiolitis ||| 1 ||| Viral croup causes subglottic edema and a seal-bark, brassy cough that often worsens at night.
upper ||| Which finding points to EPIGLOTTITIS rather than croup? ||| Gradual onset with a barking cough ||| Rapid high fever, drooling, and a child who looks acutely ill ||| A low-grade fever ||| Expiratory wheezing ||| 1 ||| Epiglottitis is rapid and bacterial: high fever, drooling, painful swallowing, a cherry-red swollen epiglottis, tripod posture, and a toxic appearance.
upper ||| In suspected croup or epiglottitis, the single most important action to AVOID is: ||| Giving oxygen ||| Examining the oropharynx or airway ||| Transporting the child ||| Keeping the child calm ||| 1 ||| Examining the oropharynx can trigger complete airway obstruction; keep the child calm and transport.
upper ||| Bacterial tracheitis is best described as a: ||| Viral illness of adolescents ||| Bacterial subglottic/tracheal infection that often follows viral croup, with high fever and coughing up pus or mucus ||| Wheezing illness without fever ||| Chronic airway condition ||| 1 ||| It is a bacterial infection of the subglottic airway, mainly in infants and toddlers, following viral croup, with a high-grade fever and purulent secretions; manage it like epiglottitis.
upper ||| For a responsive child with a COMPLETE foreign-body airway obstruction, you should perform: ||| Blind finger sweeps ||| Abdominal thrusts ||| Back blows only ||| Immediate cricothyrotomy ||| 1 ||| A responsive child with complete obstruction gets abdominal thrusts (an infant gets 5 back blows and 5 chest thrusts); if unresponsive, begin CPR.
upper ||| Which presentation points to CROUP rather than epiglottitis? ||| Sudden high fever, drooling, and a tripod posture with no cough ||| Gradual onset with a harsh, barking, seal-like cough that's worse at night ||| A muffled 'hot-potato' voice with severe pain on swallowing ||| Progression to complete obstruction within minutes ||| 1 ||| Croup (viral, subglottic) brings a barking, brassy cough, often after dark. Epiglottitis (bacterial) brings rapid high fever, drooling, dysphagia, a muffled voice, and tripod positioning — with no barking cough.
upper ||| A child with suspected epiglottitis is drooling and tripoding with a high fever. You must NOT: ||| Give humidified or blow-by oxygen ||| Keep the child calm on the parent's lap ||| Inspect the oropharynx with a tongue blade to confirm the diagnosis ||| Prepare for two-rescuer BVM in case the airway obstructs ||| 2 ||| Never inspect the airway, start IVs, or take a blood pressure — agitation can trigger complete obstruction. Keep the child calm, give oxygen, and transport gently with intubation reserved for complete obstruction.
upper ||| Bacterial tracheitis is best characterized as: ||| A purely viral illness identical to croup ||| A bacterial subglottic-tracheal infection, often following viral croup, with high fever and purulent secretions ||| Inflammation of the epiglottis caused by H. influenzae ||| A lower-airway disease producing expiratory wheeze ||| 1 ||| Bacterial tracheitis is a bacterial infection of the subglottic trachea that often follows viral croup, with high fever and coughing up pus or mucus. Manage it like epiglottitis; intubate only for complete obstruction.
lower ||| Asthma's airway obstruction results primarily from: ||| Pump failure ||| Bronchospasm and excessive mucus production ||| Swelling of the epiglottis ||| A foreign body ||| 1 ||| Asthma involves bronchospasm and excessive mucus production, narrowing the lower airways.
lower ||| Wheezing in an infant under 1 year with a recent viral illness most likely represents: ||| Asthma ||| Bronchiolitis, commonly from RSV ||| Epiglottitis ||| Croup ||| 1 ||| Bronchiolitis is a viral infection (commonly RSV) of the small airways in infants under 1; asthma rarely occurs before age 1.
lower ||| During a severe asthma attack, which finding is the MOST ominous? ||| Loud expiratory wheezing ||| No audible wheezing at all ||| A productive cough ||| Mild tachypnea ||| 1 ||| When airflow is so reduced that no wheeze is heard, it is an ominous, life-threatening sign — not improvement; louder wheezing means more air is still moving.
lower ||| A child suddenly develops one-sided (unilateral) wheezing after a choking episode. You should suspect: ||| New-onset asthma ||| An aspirated lower-airway foreign body ||| Pneumonia ||| Croup ||| 1 ||| Unilateral wheezing after choking suggests an aspirated foreign body (a one-way-valve effect) until proven otherwise; definitive care requires bronchoscopy.
lower ||| A 6-month-old has expiratory wheezing, crackles, and a recent winter cold. Which factor best distinguishes bronchiolitis from asthma here? ||| The fact that wheezing is present at all ||| The child's age — asthma rarely occurs before 1, making bronchiolitis (RSV) more likely ||| The presence of a low-grade fever ||| Whether the wheeze responds to a bronchodilator ||| 1 ||| Age is the key discriminator: asthma rarely appears before age 1, while bronchiolitis — usually RSV — is common in infants and mimics asthma with expiratory wheeze and crackles.
lower ||| During an acute asthma attack, which finding is the MOST ominous? ||| Loud, high-pitched expiratory wheezing ||| Tachypnea with accessory muscle use ||| A 'silent chest' with no audible wheezing ||| A productive cough ||| 2 ||| A silent chest means airflow is so reduced that the wheeze disappears — a sign of severe, life-threatening obstruction, not improvement. Louder wheezing actually means more air is still moving.
shock ||| Shock (hypoperfusion) is best defined as: ||| High blood pressure with bounding pulses ||| Inadequate tissue perfusion with oxygen and nutrients and inadequate removal of wastes ||| A fast heart rate by itself ||| A low blood sugar ||| 1 ||| Shock is inadequate perfusion, leading to tissue hypoxia, metabolic acidosis, and cell death.
shock ||| The hallmark that separates DECOMPENSATED shock from compensated shock is: ||| Tachycardia ||| A falling (low) blood pressure ||| Cool skin ||| Anxiety ||| 1 ||| A falling blood pressure marks decompensation — and in children it is a late, ominous sign.
shock ||| In a child, hypotension (low blood pressure) is: ||| An early, reliable sign of shock ||| A late sign, because a child can be in shock with a normal blood pressure ||| Unrelated to shock ||| Seen only in adults ||| 1 ||| Children compensate efficiently with vasoconstriction, so blood pressure stays normal until late; hypotension is ominous.
shock ||| The most common cause of shock in children is: ||| Cardiogenic ||| Hypovolemic (loss of fluid or blood) ||| Neurogenic ||| Obstructive ||| 1 ||| Hypovolemia from vomiting/diarrhea (fluid loss) or hemorrhage (blood loss) is the most common cause.
shock ||| Distributive shock is characterized by: ||| Failure of the heart to pump ||| Loss of vascular tone with vasodilation, so blood is distributed poorly and pressure falls ||| Loss of circulating blood volume ||| A mechanical blockage of blood flow ||| 1 ||| In distributive shock the vessels lose tone and dilate; it includes septic, anaphylactic, and neurogenic shock.
shock ||| A febrile, ill-appearing infant with mottled skin, poor feeding, tachycardia, and capillary refill greater than 2 seconds most likely has: ||| Neurogenic shock ||| Septic shock ||| Cardiogenic shock ||| An allergic reaction ||| 1 ||| Septic shock from a bloodstream infection: ill appearance, fever, altered mental status, mottled skin, poor feeding, tachycardia, and capillary refill greater than 2 seconds.
shock ||| The FIRST-line medication for anaphylactic shock is: ||| Intravenous dopamine ||| Intramuscular epinephrine ||| An oral antihistamine alone ||| Atropine ||| 1 ||| Give intramuscular epinephrine first, plus an antihistamine, oxygen, and access; for decompensated shock give IV epinephrine and IV diphenhydramine.
shock ||| Neurogenic shock is caused by: ||| A bloodstream infection ||| A spinal cord injury that interrupts nervous control of the vessels, causing vasodilation ||| Severe dehydration ||| An allergic reaction ||| 1 ||| Spinal cord injury removes nervous control of the vessels, causing sudden vasodilation; manage with a pressor, injury stabilization, and oxygen.
shock ||| Cardiogenic shock in children is: ||| The most common type of shock ||| Rare, and caused by conditions such as congenital heart disease or cardiomyopathy ||| Always due to dehydration ||| Easily reversed ||| 1 ||| Cardiogenic shock is rare in children (congenital heart disease, cardiomyopathy) and is often ominous.
shock ||| Initial management of hypovolemic shock includes: ||| Vasopressors first ||| Supplemental oxygen, vascular access, and isotonic fluid boluses ||| Immediate defibrillation ||| Oral rehydration only ||| 1 ||| Give oxygen, obtain access, and administer 20 mL/kg isotonic boluses, reassessing and repeating as needed.
shock ||| The hallmark that separates COMPENSATED from DECOMPENSATED shock in a child is: ||| The presence of tachycardia ||| Delayed capillary refill ||| A falling (hypotensive) blood pressure ||| Cool extremities ||| 2 ||| In compensated shock the BP is held normal (with tachycardia, delayed cap refill, cool/pale skin). A falling blood pressure marks decompensation — a late, ominous sign in children.
shock ||| Which is the MOST common cause of shock in children? ||| Cardiogenic shock ||| Hypovolemic shock from fluid loss (vomiting/diarrhea) or blood loss ||| Neurogenic shock ||| Obstructive shock ||| 1 ||| Hypovolemia — from dehydration or hemorrhage — is the most common pediatric shock. Cardiogenic is rare and ominous; obstructive is the least common.
shock ||| A febrile, mottled, lethargic infant has a 4-second capillary refill and poor feeding. Which category and management fit best? ||| Cardiogenic shock; restrict fluids ||| Neurogenic shock; immobilize the spine ||| Septic (distributive) shock; oxygen, access, consider pressors, rapid transport ||| Anaphylactic shock; intramuscular epinephrine ||| 2 ||| Fever + mottling + poor perfusion + poor feeding is septic (distributive) shock. Treat with oxygen, access, fluids, consider epinephrine or dopamine pressors, and transport rapidly — a septic child can deteriorate fast.
shock ||| Neurogenic shock in a child results from: ||| A massive bacterial bloodstream infection ||| A spinal cord injury that interrupts nervous control of vascular tone, causing vasodilation ||| Pump failure from a congenital heart defect ||| Re-exposure to a known allergen ||| 1 ||| Neurogenic shock is loss of sympathetic vascular control after spinal cord injury, producing widespread vasodilation. Manage with a pressor, injury stabilization, and oxygen.
shock ||| A child with a known peanut allergy develops hives, wheezing, and hypotension after exposure. The priority medication is: ||| Intramuscular epinephrine ||| Oral diphenhydramine alone ||| A 20 mL/kg fluid bolus alone ||| Albuterol alone ||| 0 ||| Anaphylaxis demands intramuscular epinephrine first (with an antihistamine, oxygen, and access). For decompensated shock, the protocol moves to IV epinephrine and IV diphenhydramine.
pals ||| The most common arrhythmia in children is a bradyarrhythmia, which is usually caused by: ||| A primary cardiac defect ||| Hypoxia ||| Hyperglycemia ||| Dehydration ||| 1 ||| Pediatric bradycardia is usually caused by hypoxia (and vagal stimulation); treat with oxygen and ventilation first.
pals ||| Supraventricular tachycardia (SVT) in a child is typically: ||| A wide-complex rhythm under 100/min ||| A narrow-complex rhythm at 220/min or faster ||| An irregular rhythm at 60/min ||| Identical to sinus tachycardia at 120/min ||| 1 ||| SVT is a narrow-complex tachycardia at 220/min or faster — too fast to fill, leading to heart failure or cardiogenic shock.
pals ||| The pediatric defibrillation energy sequence is: ||| 1 then 2 J/kg ||| 2 then 4 J/kg ||| 0.5 then 1 J/kg ||| Always 360 J ||| 1 ||| Defibrillation is 2 J/kg for the first shock, then 4 J/kg; synchronized cardioversion is 0.5 to 1 J/kg, then 2 J/kg.
pals ||| For unstable pediatric bradycardia that persists despite oxygen and ventilation, the next step is: ||| Atropine alone ||| Epinephrine IV/IO ||| Synchronized cardioversion ||| Defibrillation ||| 1 ||| Ventilate with 100% oxygen first; if bradycardia persists, give epinephrine IV/IO.
pals ||| The MOST common pediatric arrhythmia, and its usual underlying cause, is: ||| Supraventricular tachycardia from re-entry ||| Ventricular fibrillation from an electrolyte abnormality ||| Bradyarrhythmia from hypoxia ||| Atrial fibrillation from structural heart disease ||| 2 ||| Bradycardia is the most common pediatric arrhythmia and usually stems from hypoxia (and vagal stimulation). The fix is to treat the hypoxia first — oxygen and ventilation — before drugs.
pals ||| A child's monitor shows a narrow-complex tachycardia at 240/min. The child is alert with adequate perfusion. The appropriate next step is to: ||| Perform immediate unsynchronized defibrillation ||| Attempt vagal maneuvers ||| Begin chest compressions ||| Give a 20 mL/kg fluid bolus ||| 1 ||| This is SVT (narrow complex, 220+). If the child is stable, give oxygen, attempt vagal maneuvers, and transport. Synchronized cardioversion is for the unstable or decompensating child.
neuro ||| A convulsion caused by a rapid rise in body temperature is called a: ||| Generalized epileptic seizure ||| Febrile seizure ||| Partial (focal) seizure ||| Episode of status epilepticus ||| 1 ||| A febrile seizure results from a sudden increase in body temperature, most commonly between 6 months and 6 years of age.
neuro ||| Which statement correctly distinguishes seizure types? ||| Partial seizures always cause loss of consciousness ||| A generalized seizure involves both sides of the body with a tense-relax pattern and loss of consciousness, while a partial seizure involves one area ||| The two types are identical ||| Generalized seizures affect only one limb ||| 1 ||| Partial (focal) seizures involve one area without loss of consciousness; generalized seizures involve both sides with a tense-relax pattern and loss of consciousness.
neuro ||| Meningitis in an older child classically presents with: ||| A bulging fontanelle and poor feeding ||| High fever, severe headache, and a stiff neck ||| Wheezing and a cough ||| No symptoms at all ||| 1 ||| Older children show high fever, severe headache, stiff neck, and lethargy/irritability; in an infant, watch the anterior fontanelle, where bulging is concerning.
neuro ||| A 2-year-old has a brief generalized seizure during a rapid fever spike and is now postictal. The most accurate statement is: ||| This is status epilepticus requiring immediate benzodiazepines ||| It's a febrile seizure — usually benign, but still evaluate and transport ||| Febrile seizures never warrant transport ||| You should submerge the child in an ice bath to cool rapidly ||| 1 ||| Febrile seizures follow a rapid temperature rise, are usually benign, but still require evaluation and transport. Remove excess clothing but avoid extreme cooling. Status epilepticus is prolonged or repeated seizing without recovery.
neuro ||| Compared with older children, meningitis in a young infant more often presents with: ||| Classic severe headache and a stiff neck ||| Subtle, nonspecific signs — poor feeding, irritability, a bulging fontanelle ||| No fever at any point in the illness ||| Sudden one-sided paralysis ||| 1 ||| Infants show subtle signs — poor feeding, irritability, lethargy, a bulging fontanelle — rather than the classic headache and nuchal rigidity of older children. Meningitis can be rapidly fatal, so transport quickly with standard precautions.
gimet ||| The most significant danger from vomiting and diarrhea in a young child is: ||| Hyperglycemia ||| Dehydration and electrolyte loss ||| Hypertension ||| A seizure ||| 1 ||| Fluid and electrolyte loss causes dehydration, a common cause of pediatric hypovolemic shock; replace fluids.
gimet ||| Treatment for hypoglycemia is generally initiated when the blood glucose drops below: ||| 120 mg/dL ||| 70 mg/dL ||| 200 mg/dL ||| 40 mg/dL ||| 1 ||| Treatment is initiated when the blood sugar drops below 70 mg/dL.
gimet ||| For a conscious, alert child with hypoglycemia, the appropriate treatment is: ||| Immediate IV dextrose ||| Oral fluids with sugar or oral glucose ||| IM glucagon only ||| Withholding all sugar ||| 1 ||| A conscious, alert child gets oral fluids with sugar or oral glucose; if there is altered mental status or no response, consult medical direction for IV dextrose or IM glucagon.
gimet ||| Hyperglycemia progressing to diabetic ketoacidosis typically presents with: ||| Rapid onset with pale, sweaty skin ||| Gradual onset with fruity breath, dehydration, and a glucose over 200 mg/dL ||| Bradycardia with hypertension ||| A glucose of 50 mg/dL ||| 1 ||| DKA develops gradually with a fruity breath odor, metabolic acidosis, dehydration, and a glucose over 200 mg/dL, progressing to coma if untreated.
gimet ||| Which picture fits HYPOglycemia rather than hyperglycemia? ||| Gradual onset with a fruity breath odor ||| Rapid onset with pallor, sweating, and shakiness ||| A glucose over 200 mg/dL ||| Deep dehydration developing over days ||| 1 ||| Hypoglycemia comes on rapidly (pale, sweaty, shaky); hyperglycemia/DKA is gradual (fruity breath, dehydration, glucose over 200).
gimet ||| The greatest danger from a child's vomiting and diarrhea (gastroenteritis) is: ||| Aspiration pneumonia ||| Dehydration and electrolyte loss ||| Hyperglycemia ||| Bowel obstruction ||| 1 ||| Vomiting and diarrhea are symptoms, not the disease. The main threat is dehydration and electrolyte disturbance — replace fluids, with IV therapy when indicated.
gimet ||| A diabetic 10-year-old is confused and diaphoretic with a glucose of 55 mg/dL but can still swallow and follow commands. The best initial treatment is: ||| Intramuscular glucagon ||| IV dextrose immediately ||| Oral glucose or sugary fluids ||| Withhold sugar and transport for evaluation ||| 2 ||| Conscious, alert, and able to swallow means oral glucose or sugary fluids. Reserve IV dextrose or IM glucagon for altered mental status or no response. Treat hypoglycemia (below 70 mg/dL) promptly.
gimet ||| Which findings point toward diabetic ketoacidosis rather than hypoglycemia? ||| Rapid onset, pale and diaphoretic skin, normal breath ||| Gradual onset, fruity breath odor, dehydration, and metabolic acidosis ||| Bradycardia with hypertension ||| A glucometer reading of 50 mg/dL ||| 1 ||| DKA (hyperglycemia, usually over 200 mg/dL) develops over time with dehydration, fruity breath, and metabolic acidosis as ketones build up — the opposite of the sudden, sweaty, pale picture of hypoglycemia.
tox ||| For a RESPONSIVE child who has ingested a toxin, appropriate prehospital care includes: ||| Inducing vomiting at home ||| Contacting medical direction/poison control and transporting with the pills, substances, and containers ||| Giving large amounts of milk ||| Withholding all treatment ||| 1 ||| Give oxygen if hypoxic, contact medical direction/poison control, consider activated charcoal, take the pills/substances/containers to the hospital, and monitor continuously.
tox ||| For an UNRESPONSIVE poisoned child, the FIRST priority is: ||| Identifying the exact poison before acting ||| Securing the airway and being ready to ventilate ||| Inducing vomiting ||| Giving oral glucose only ||| 1 ||| Secure the airway and suction, give oxygen, and be ready to ventilate; contact poison control/medical direction and transport with the substances, ruling out trauma as a cause of altered mental status.
tox ||| For a RESPONSIVE child who ingested an unknown substance, appropriate management includes: ||| Inducing vomiting immediately ||| Contacting poison control / medical direction, considering activated charcoal, and transporting with the container ||| Giving a large fluid bolus to dilute the toxin ||| Withholding oxygen so symptoms aren't masked ||| 1 ||| For a responsive ingestion: oxygen if hypoxic, contact poison control and medical direction, consider activated charcoal, bring the pills and containers, and monitor for deterioration. Poisoning is the leading cause of preventable death under age 5.
trauma ||| The leading cause of injury death in children ages 1 to 15 years is: ||| Infections ||| Accidents (unintentional injury) ||| Congenital defects ||| Cancer ||| 1 ||| Accidents are the leading cause of injury deaths in children ages 1 to 15.
trauma ||| Waddell's triad, seen when a car strikes a child pedestrian, consists of: ||| Three rib fractures ||| Ipsilateral femur fracture, ipsilateral chest/abdominal injury, and contralateral head injury ||| Bilateral femur fractures ||| Skull, neck, and spine fractures ||| 1 ||| Waddell's triad is an ipsilateral femur fracture, an ipsilateral intrathoracic/intra-abdominal injury, and a contralateral head injury.
trauma ||| The Glasgow Coma Scale is scored as: ||| 1 to 10 total ||| Eye opening + Verbal + Motor, totaling 3 to 15 ||| 0 to 100 ||| Verbal response only, 1 to 5 ||| 1 ||| GCS = Eye opening (1 to 4) + Verbal (1 to 5) + Motor (1 to 6), totaling 3 to 15; the verbal and motor scales are modified for infants.
trauma ||| When estimating burn surface area in a child, the rule of nines is modified so that: ||| The arms count for more ||| The head is a larger percentage and the legs a smaller percentage than in adults ||| The trunk counts for less ||| It is identical to an adult ||| 1 ||| In a child the head accounts for a larger percentage of body surface area and the legs a smaller percentage than in an adult.
trauma ||| In multiple-casualty triage, the rule for choosing the algorithm is: ||| Always use START ||| Use JumpSTART if the patient appears to be a child, and START if a young adult or older ||| Use JumpSTART for everyone ||| Tag everyone red ||| 1 ||| If the patient appears to be a child, use JumpSTART; if a young adult or older, use START. JumpSTART gives an apneic child who has a pulse a brief trial of rescue breaths before tagging.
trauma ||| In START/JumpSTART triage, the tag colors mean: ||| Green = immediate and Red = minor ||| Green = minor, Yellow = delayed, Red = immediate, Black = deceased/nonsalvageable ||| Yellow = deceased ||| Black = minor ||| 1 ||| Green is minor, yellow is delayed, red is immediate, and black is deceased/nonsalvageable.
trauma ||| Waddell's triad, classically seen when a car strikes a child pedestrian, consists of: ||| Bilateral femur fractures, a pelvic injury, and facial trauma ||| Ipsilateral femur fracture, ipsilateral chest/abdominal injury, and contralateral head injury ||| A cervical fracture, flail chest, and splenic rupture ||| Contralateral femur fracture, ipsilateral head injury, and bladder rupture ||| 1 ||| Waddell's triad: a femur fracture and a chest or abdominal injury on the side that was struck, plus a head injury on the opposite side as the child is thrown by the impact.
trauma ||| When estimating burn extent with the rule of nines, the key pediatric modification is that: ||| The arms count for more than in adults ||| The head accounts for a larger % BSA and the legs a smaller % than in adults ||| The trunk is excluded in children ||| Every region is exactly 9% just like in adults ||| 1 ||| In a child the head is proportionally larger and the legs smaller, so the rule of nines is adjusted — the head gets a greater percent of body surface area and the legs a lesser percent than in an adult.
trauma ||| In the JumpSTART pediatric triage tool, a key difference from adult START is that an apneic child WITH a palpable pulse: ||| Is immediately tagged black (deceased) ||| Is given a brief trial of rescue breaths before being assigned a category ||| Is automatically tagged green (minor) ||| Skips triage and is transported first ||| 1 ||| Because pediatric arrest is usually respiratory, JumpSTART gives an apneic child who still has a pulse a short trial of rescue breaths before tagging — a deliberate departure from adult START.
sids ||| Sudden infant death syndrome (SIDS) is defined as the: ||| Death of an infant from a known suffocation ||| Sudden death of an infant under 1 year whose cause cannot be identified even after autopsy ||| Death of a child over age 2 ||| Death of an infant always due to a heart defect ||| 1 ||| SIDS is the sudden death of an infant in the first year of life whose cause cannot be identified, even after investigation and autopsy.
sids ||| A common autopsy finding in SIDS is: ||| Massive head trauma ||| Intrathoracic petechiae, in about 90% of cases ||| Bowel obstruction ||| Liver failure ||| 1 ||| About 90% of SIDS cases show intrathoracic petechiae, with pulmonary congestion and edema.
sids ||| A BRUE (brief resolved unexplained event), formerly called an ALTE, in an infant under 1 year is: ||| A prolonged febrile seizure ||| A brief, resolved, unexplained episode such as apnea, a change in color or muscle tone, or choking/gagging ||| A cough lasting several weeks ||| A normal developmental milestone ||| 1 ||| A BRUE is a brief, resolved, unexplained event (apnea, color or tone change, choking or gagging); evaluate and transport even if the infant looks normal.
sids ||| Which statement about Sudden Infant Death Syndrome (SIDS) is correct? ||| It is strongly linked to the prone (face-down) sleeping position ||| It is usually caused by suffocation from blankets or pillows ||| It results from an allergy to cow's milk ||| It is clearly hereditary ||| 0 ||| SIDS is the death of an infant under 1 year from an unknown cause, strongly linked to prone sleeping (hence 'back to sleep'). It is NOT caused by bedding suffocation, milk allergy, or aspiration, and is not thought to be hereditary.
abuse ||| Which finding should raise suspicion for child abuse? ||| A single shin bruise on a toddler learning to walk ||| Injuries in different stages of healing, or a history inconsistent with the injury ||| A skinned knee with a matching story ||| An age-appropriate minor injury ||| 1 ||| Suspect abuse when injuries do not match the history or developmental stage, when there are multiple injuries in various stages of healing, or with patterned burns and bruises.
abuse ||| Your responsibility when you suspect child abuse is to: ||| Confront the suspected abuser ||| Document your findings and report to the authorities ||| Keep the suspicion confidential ||| Release the child to whoever asks ||| 1 ||| Document your findings, treatments, and interventions, and report to the authorities.
abuse ||| Which finding should MOST raise your suspicion for child abuse? ||| A single shin bruise on a toddler who fell while running ||| Injuries in multiple stages of healing with a history that changes or doesn't fit the injury ||| A febrile seizure witnessed by the parents ||| A 5-year-old who is shy and quiet around strangers ||| 1 ||| Red flags include injuries in varied stages of healing, patterned burns or bruises (immersion lines, loop marks), fractures under age 2, and a history that's vague, inconsistent, or doesn't match the injury or the child's developmental stage. Document objectively, don't accuse, and report.`;

/* ────────────────────────── content plumbing ────────────────────────── */

const CATEGORY_LABELS = {
  dev: "Growth & Development", anat: "Anatomy", vitals: "Vital Signs",
  assess: "Assessment", airway: "Airway & Mgmt", resp: "Respiratory",
  upper: "Upper Airway", lower: "Lower Airway", shock: "Shock",
  pals: "PALS", neuro: "Neuro", gimet: "GI / Metabolic",
  tox: "Toxicology", trauma: "Trauma", sids: "SIDS / BRUE",
  abuse: "Abuse & Neglect",
};

const HIGH_YIELD = new Set([
  "airway", "resp", "upper", "lower", "dev", "anat",
  "vitals", "assess", "shock", "neuro", "gimet", "tox",
]);

/* Dispatch vs Protocol check — spec §10 heuristic. The tag is the entire
   added flavor; never prepend a fabricated scene. */
function isDispatch(prompt) {
  const p = prompt.trim();
  return (
    /\d+\s*-\s*(year|month)\s*-?\s*old/i.test(p) ||
    /^you\b/i.test(p) ||
    /^a\s+(febrile|diabetic|child|toddler|\d)/i.test(p) ||
    /suddenly develops/i.test(p) ||
    /\b(harsh|unilateral|one-sided|congested)\b/i.test(p)
  );
}

function parseBank(raw) {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const f = line.split("|||").map((s) => s.trim());
      if (f.length < 8) return null;
      return {
        id: i,
        category: f[0],
        prompt: f[1],
        options: [f[2], f[3], f[4], f[5]],
        answerIndex: Number(f[6]),
        explanation: f[7],
        dispatch: isDispatch(f[1]),
      };
    })
    .filter(Boolean);
}

const BANK = parseBank(RAW_BANK);
const BANK_IS_PLACEHOLDER = RAW_BANK.includes("[PLACEHOLDER");

/* ─────────────────────── tunable constants (spec §6/§8) ─────────────── */

const T = { TICK_MS: 90, SPIN_MS: 800, BEAT_MS: 640, RESOLVE_MS: 720, FLASH_MS: 560 };
const START_QUARTERS = 20;
const SPIN_COST = 1;
const RESTOCK = 20;
const PAYOUT = [0, 1, 3, 10]; // by stars in a spin
const SPIN_GLYPHS = ["✚", "♥", "◆"];

const BANNERS = [
  "NO STARS — reset and roll again",
  "ONE STAR — on the board",
  "TWO STARS — one reel off the trifecta",
  "CODE 3 — RUNNING HOT · THREE STARS",
];

function heatTier(streak) {
  return streak >= 5 ? "blazing" : streak >= 3 ? "warm" : "cool";
}

function shiftLine(answered, correct) {
  if (!answered) return "Clock in when you’re ready.";
  const pct = (100 * correct) / answered;
  if (pct >= 85) return "Sharp shift. You’re running these cold.";
  if (pct >= 60) return "Solid work — a few reels to firm up and you’re golden.";
  return "Good reps in. Every flatline you cleared is one you won’t miss on the test.";
}

/* ─────────────────────────── small utilities ────────────────────────── */

function shuffleQuestion(q) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    q,
    options: order.map((o) => q.options[o]),
    correctIndex: order.indexOf(q.answerIndex),
    picked: null,
    result: null, // 'star' | 'flat'
  };
}

function drawThree(bank) {
  const idx = bank.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(3, idx.length)).map((i) => shuffleQuestion(bank[i]));
}

/* Counts a displayed number up one step at a time on increases (the
   quarter counter "ticks up on payout", spec §11); decreases apply
   instantly. Disabled → always instant. */
function useCountUp(target, enabled, msPerStep = 80) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (!enabled || target <= from) {
      setVal(target);
      return;
    }
    setVal(from);
    const iv = setInterval(() => {
      setVal((v) => {
        if (v + 1 >= target) {
          clearInterval(iv);
          return target;
        }
        return v + 1;
      });
    }, msPerStep);
    return () => clearInterval(iv);
  }, [target, enabled]);
  return val;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
    return () =>
      mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn);
  }, []);
  return reduced;
}

/* ────────────────────────────── SVG art ─────────────────────────────── */

function StarOfLife({ lit, dim }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={"sol" + (lit ? " lit" : "") + (dim ? " dim" : "")}
      aria-hidden="true"
      focusable="false"
    >
      <g>
        {[0, 60, 120].map((r) => (
          <rect key={r} className="sol-bar" x="41" y="3" width="18" height="94" rx="5"
            transform={`rotate(${r} 50 50)`} />
        ))}
        <circle className="sol-hub" cx="50" cy="50" r="16.5" />
        <path className="sol-rod" d="M50 35.5 V64.5" />
        <path
          className="sol-snake"
          d="M43.5 40 c11 -4.5 15.5 5.5 3 8.5 c-13.5 3 -9 13 3.5 8.5 c11 -4 15 6 3 9"
        />
      </g>
    </svg>
  );
}

function FlatlineX() {
  return (
    <svg viewBox="0 0 100 62" className="flatx" aria-hidden="true" focusable="false">
      <path className="ecg" d="M4 36 H32 L38 14 L45 50 L51 36 H96" />
      <path className="xs" d="M24 12 L76 50" />
      <path className="xs" d="M76 12 L24 50" />
    </svg>
  );
}

function AmbulanceBadge() {
  return (
    <svg viewBox="0 0 128 64" className="amb" aria-hidden="true" focusable="false">
      {/* box body */}
      <rect x="6" y="16" width="76" height="34" rx="4" fill="#f4f8fc" />
      {/* cab */}
      <path d="M82 22 h20 l14 14 v14 h-34 z" fill="#f4f8fc" />
      <path d="M88 26 h12 l9 9 h-21 z" fill="#0a141e" />
      {/* stripe */}
      <rect x="6" y="36" width="110" height="7" fill="#e11d2e" />
      {/* star of life on body */}
      <g transform="translate(38 28)" fill="#2a86ff">
        <rect x="-2.6" y="-9" width="5.2" height="18" rx="1.6" />
        <rect x="-2.6" y="-9" width="5.2" height="18" rx="1.6" transform="rotate(60)" />
        <rect x="-2.6" y="-9" width="5.2" height="18" rx="1.6" transform="rotate(120)" />
        <circle r="4.6" fill="#f4f8fc" />
        <circle r="3.2" fill="#2a86ff" />
      </g>
      {/* roof beacon */}
      <rect x="30" y="10" width="12" height="7" rx="2" fill="#e11d2e" />
      {/* wheels */}
      <circle cx="28" cy="52" r="8.5" fill="#151b22" />
      <circle cx="28" cy="52" r="3.6" fill="#67737f" />
      <circle cx="98" cy="52" r="8.5" fill="#151b22" />
      <circle cx="98" cy="52" r="3.6" fill="#67737f" />
      {/* bumper */}
      <rect x="112" y="44" width="8" height="5" rx="1.5" fill="#9aa6b1" />
    </svg>
  );
}

/* ───────────────────────────── sub-views ────────────────────────────── */

function LightBar({ rave }) {
  const cluster = (bank, k) => (
    <span key={k} className={"lb-cluster " + bank}>
      {Array.from({ length: 5 }).map((_, i) => (
        <i key={i} className="led" />
      ))}
    </span>
  );
  return (
    <div className={"lightbar" + (rave ? " rave" : "")} aria-hidden="true">
      <div className="lb-shell">
        {cluster("red", "r1")}
        {cluster("red", "r2")}
        <span className="lb-center" />
        {cluster("blue", "b1")}
        {cluster("blue", "b2")}
      </div>
    </div>
  );
}

function MarkerLights() {
  return (
    <div className="markers" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="mk" style={{ animationDelay: `${i * 0.28}s` }} />
      ))}
    </div>
  );
}

function Pane({ face, glyph }) {
  return (
    <div className={"pane pane-" + face.kind}>
      {face.kind === "idle" && <span className="coin">25¢</span>}
      {face.kind === "spin" && <span className="glyph">{glyph}</span>}
      {face.kind === "live" && <span className="glyph">{glyph}</span>}
      {face.kind === "pending" && <span className="q bright">?</span>}
      {face.kind === "future" && <span className="q dim">?</span>}
      {face.kind === "star" && <StarOfLife lit />}
      {face.kind === "flat" && <FlatlineX />}
    </div>
  );
}

function Gauge({ label, value, hot, coin }) {
  return (
    <div className={"gauge" + (hot ? " hot" : "")}>
      <span className="g-value">
        {coin && <i className="g-coin" aria-hidden="true" />}
        {value}
      </span>
      <span className="g-label">{label}</span>
    </div>
  );
}

function Paytable() {
  return (
    <div className="paytable">
      <div className="pt-title">Payout — Code 3</div>
      <div className="pt-row"><span className="pt-stars">3 stars</span><span className="pt-pay plus">+10</span></div>
      <div className="pt-row"><span className="pt-stars">2 stars</span><span className="pt-pay plus">+3</span></div>
      <div className="pt-row"><span className="pt-stars">1 star</span><span className="pt-pay plus">+1</span></div>
      <div className="pt-row"><span className="pt-stars">0</span><span className="pt-pay">you keep the lesson</span></div>
    </div>
  );
}

function QuestionCard({ reel, index, onPick, locked }) {
  const { q, options } = reel;
  const cat = CATEGORY_LABELS[q.category] || q.category;
  return (
    <div className="qcard">
      <div className="q-head">
        <span className="q-title">
          <span className={"tagword " + (q.dispatch ? "dispatch" : "protocol")}>
            {q.dispatch ? "Dispatch" : "Protocol check"}:
          </span>{" "}
          {cat}
        </span>
        {HIGH_YIELD.has(q.category) && <span className="hy">HIGH-YIELD</span>}
      </div>
      <p className="prompt">
        <strong className="reelpre">Reel {index + 1} of 3:</strong> {q.prompt}
      </p>
      <div className="opts">
        {options.map((opt, i) => {
          let cls = "opt";
          if (reel.picked === i) {
            cls += reel.result === "star" ? " hit" : " miss";
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={locked}
              onClick={() => onPick(i)}
            >
              <span className="key">{"ABCD"[i]}</span>
              <span className="opt-text">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Payout count-up for the result card — animates only for multi-quarter
   wins so small outcomes stay modest; the jackpot gets the full climb. */
function PayCount({ amount, animate }) {
  const [n, setN] = useState(animate ? 0 : amount);
  useEffect(() => {
    if (!animate) {
      setN(amount);
      return;
    }
    setN(0);
    const iv = setInterval(() => {
      setN((v) => {
        if (v + 1 >= amount) {
          clearInterval(iv);
          return amount;
        }
        return v + 1;
      });
    }, 90);
    return () => clearInterval(iv);
  }, [amount, animate]);
  return <>{n}</>;
}

function Result({ reels, stars, payout, reduced }) {
  const misses = reels
    .map((r, i) => ({ ...r, reelNo: i + 1 }))
    .filter((r) => r.result === "flat");
  return (
    <div className="result">
      <div className={"banner s" + stars} role="status">
        {BANNERS[stars]}
      </div>
      {payout > 0 && (
        <div className="payline">
          +<PayCount amount={payout} animate={!reduced && payout > 1} /> quarter
          {payout === 1 ? "" : "s"}
        </div>
      )}
      {stars === 3 && <div className="sweep">Clean trifecta — all three sourced cold. ★</div>}
      {misses.length > 0 && (
        <div className="missrev">
          <div className="mr-head">Clear these before the next run</div>
          {misses.map((m) => (
            <div className="miss" key={m.reelNo}>
              <div className="m-meta">
                <span className="m-reel">Reel {m.reelNo}</span>
                <span className="m-cat">{CATEGORY_LABELS[m.q.category] || m.q.category}</span>
              </div>
              <p className="m-q">{m.q.prompt}</p>
              <p className="m-a">
                <strong>Correct:</strong> {m.options[m.correctIndex]}
              </p>
              <p className="m-exp">{m.q.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportOverlay({ stats, onClose }) {
  const btnRef = useRef(null);
  useEffect(() => {
    btnRef.current && btnRef.current.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const { runs, answered, correct, bestStreak, code3s } = stats;
  const acc = answered ? Math.round((100 * correct) / answered) + "%" : "—";
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Shift Report">
      <div className="report">
        <h2 className="r-title">SHIFT REPORT</h2>
        <div className="r-grid">
          <div className="r-stat"><span className="r-num">{runs}</span><span className="r-lab">runs</span></div>
          <div className="r-stat"><span className="r-num">{acc}</span><span className="r-lab">accuracy</span></div>
          <div className="r-stat"><span className="r-num">{bestStreak}</span><span className="r-lab">best streak</span></div>
          <div className="r-stat"><span className="r-num">{code3s}</span><span className="r-lab">Code 3s</span></div>
        </div>
        <p className="r-line">{shiftLine(answered, correct)}</p>
        <p className="r-always">Good place to clock out — or jump back on the rig.</p>
        <button type="button" ref={btnRef} className="btn back" onClick={onClose}>
          BACK TO THE RIG ▸
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ main component ═══════════════════════════ */

export default function ScreamingSirens() {
  const reduced = usePrefersReducedMotion();

  const [phase, setPhase] = useState("idle"); // idle | spinning | answering | resolved
  const [quarters, setQuarters] = useState(START_QUARTERS);
  const [heat, setHeat] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [code3s, setCode3s] = useState(0);
  const [runs, setRuns] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reels, setReels] = useState([]);
  const [activeReel, setActiveReel] = useState(0);
  const [spinTick, setSpinTick] = useState(0);
  const [flashWin, setFlashWin] = useState(false);
  const [lastStars, setLastStars] = useState(0);
  const [lastPayout, setLastPayout] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const lockRef = useRef(false);
  const timers = useRef([]);
  const after = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const broke = quarters < SPIN_COST;
  const tier = heatTier(heat);
  const rave = phase === "resolved" && lastStars === 3;
  const shownQuarters = useCountUp(quarters, !reduced);

  /* spin glyph ticker — the active reel keeps rolling while the player
     answers and locks on answer; static bright ? under reduced motion */
  const ticking = phase === "spinning" || (phase === "answering" && !reduced);
  useEffect(() => {
    if (!ticking) return;
    const iv = setInterval(() => setSpinTick((t) => t + 1), T.TICK_MS);
    return () => clearInterval(iv);
  }, [ticking]);

  const respond = useCallback(() => {
    if (phase !== "idle" || quarters < SPIN_COST || BANK.length < 3) return; // spec §17
    setQuarters((q) => q - SPIN_COST);
    setRuns((r) => r + 1);
    setReels(drawThree(BANK));
    setActiveReel(0);
    lockRef.current = false;
    if (reduced) {
      setPhase("answering"); // reduced motion: skip the spin (spec §6)
    } else {
      setPhase("spinning");
      after(T.SPIN_MS, () => setPhase("answering"));
    }
  }, [phase, quarters, reduced, after]);

  const restock = useCallback(() => {
    if (phase !== "idle" || !broke) return;
    setQuarters((q) => q + RESTOCK);
  }, [phase, broke]);

  const resolve = useCallback((finalReels) => {
    const stars = finalReels.filter((r) => r.result === "star").length;
    const pay = PAYOUT[stars];
    setLastStars(stars);
    setLastPayout(pay);
    if (pay) setQuarters((q) => q + pay);
    if (stars === 3) setCode3s((c) => c + 1);
    setPhase("resolved");
  }, []);

  const pick = useCallback(
    (i) => {
      if (phase !== "answering" || lockRef.current) return; // lock after first answer (spec §17)
      lockRef.current = true;
      const reel = reels[activeReel];
      const hit = i === reel.correctIndex;
      const next = reels.map((r, idx) =>
        idx === activeReel ? { ...r, picked: i, result: hit ? "star" : "flat" } : r
      );
      setReels(next);
      setAnswered((a) => a + 1);
      if (hit) {
        setCorrect((c) => c + 1);
        setHeat((h) => {
          const nh = h + 1;
          setBestStreak((b) => Math.max(b, nh));
          return nh;
        });
        setFlashWin(true);
        after(T.FLASH_MS, () => setFlashWin(false));
      } else {
        setHeat(0);
      }
      if (activeReel < 2) {
        after(T.BEAT_MS, () => {
          setActiveReel((r) => r + 1);
          lockRef.current = false;
        });
      } else {
        after(T.RESOLVE_MS, () => {
          resolve(next);
          lockRef.current = false;
        });
      }
    },
    [phase, reels, activeReel, after, resolve]
  );

  const runItBack = useCallback(() => {
    if (phase !== "resolved") return;
    setReels([]);
    setActiveReel(0);
    setPhase("idle");
  }, [phase]);

  /* windshield faces (symbols only — never question text) */
  const faces = useMemo(() => {
    return [0, 1, 2].map((i) => {
      if (phase === "spinning") return { kind: "spin" };
      const r = reels[i];
      if (!r) return { kind: "idle" };
      if (r.result === "star") return { kind: "star" };
      if (r.result === "flat") return { kind: "flat" };
      if (phase === "answering")
        return i === activeReel ? { kind: reduced ? "pending" : "live" } : { kind: "future" };
      return { kind: "idle" };
    });
  }, [phase, reels, activeReel, reduced]);

  const accuracy = answered ? Math.round((100 * correct) / answered) + "%" : "—";

  /* console button + subtext by state */
  let consoleBtn;
  let subtext;
  if (phase === "resolved") {
    consoleBtn = (
      <button type="button" className="btn runback" onClick={runItBack}>
        RUN IT BACK ▸
      </button>
    );
    subtext = "Three fresh calls on deck.";
  } else if (phase === "idle" && broke) {
    consoleBtn = (
      <button type="button" className="btn restock" onClick={restock}>
        RESTOCK THE RIG (+20)
      </button>
    );
    subtext = "Out of quarters — restock and keep rolling, no limit.";
  } else {
    consoleBtn = (
      <button
        type="button"
        className="btn respond"
        onClick={respond}
        disabled={phase !== "idle"}
      >
        ◉ RESPOND · INSERT 25¢
      </button>
    );
    subtext =
      phase === "answering"
        ? "answer to lock the reel"
        : phase === "spinning"
        ? "reels rolling…"
        : "Three calls, three reels — every right answer ignites a Star of Life.";
  }

  return (
    <div className="ss-stage">
      <style>{CSS}</style>
      <div className={`rig heat-${tier}${rave ? " code3" : ""}${reduced ? " rm" : ""}`}>
        <div className="frame">
          <div className="shell">
            <MarkerLights />

            {/* box-body header: lamp + quarters · dominant marquee · stat stack */}
            <div className="head">
              <div className="head-l">
                <span className="corner-lamp" aria-hidden="true" />
                <Gauge label="Quarters" value={shownQuarters} coin />
              </div>
              <div className="marquee">
                <h1 className="title">
                  SCREAMING SIRENS <AmbulanceBadge />
                </h1>
                <div className="sub">Paramedic Edition</div>
                <span className="mq-div" aria-hidden="true" />
                <div className="chap">Chapter 47</div>
                <div className="chap2">Pediatrics</div>
                <div className="plate">MEDIC 47</div>
              </div>
              <div className="head-r">
                <Gauge label="Siren heat" value={heat} hot={heat >= 3} />
                <Gauge label="Code 3s" value={code3s} />
                <Gauge label="Accuracy" value={accuracy} />
              </div>
            </div>

            {/* light-bar pod between marquee and cab */}
            <LightBar rave={rave} />

            {/* cab zone: pillar strips outside the silver cab */}
            <div className="cabzone">
              <span className="strip left" aria-hidden="true" />
              <div className="cab">
                <div className={"bayinset" + (flashWin ? " winflash" : "")}>
                  <i className="rivet r1" aria-hidden="true" />
                  <i className="rivet r2" aria-hidden="true" />
                  <i className="rivet r3" aria-hidden="true" />
                  <i className="rivet r4" aria-hidden="true" />
                  {faces.map((f, i) => (
                    <Pane key={i} face={f} glyph={SPIN_GLYPHS[(spinTick + i) % SPIN_GLYPHS.length]} />
                  ))}
                  {rave && !reduced && <div className="flare" aria-hidden="true" />}
                </div>
                {/* cowl: vents · action button · dome knob */}
                <div className="console">
                  <span className="vents" aria-hidden="true" />
                  {consoleBtn}
                  <span className="dome-knob" aria-hidden="true" />
                </div>
                <div className="hood-lamps">
                  <span className="turn" aria-hidden="true" />
                  <div className="subtext" aria-live="polite">{subtext}</div>
                  <span className="turn" aria-hidden="true" />
                </div>
              </div>
              <span className="strip right" aria-hidden="true" />
            </div>

            {/* body: run-sheet recessed into the cabinet between chevron rails */}
            <div className="bay">
              <span className="chevcol" aria-hidden="true" />
              <div className="sheet">
                {(phase === "idle" || phase === "spinning") && <Paytable />}
                {phase === "answering" && reels[activeReel] && (
                  <QuestionCard
                    reel={reels[activeReel]}
                    index={activeReel}
                    onPick={pick}
                    locked={reels[activeReel].result !== null}
                  />
                )}
                {phase === "resolved" && (
                  <Result reels={reels} stars={lastStars} payout={lastPayout} reduced={reduced} />
                )}
                <button type="button" className="endshift" onClick={() => setReportOpen(true)}>
                  End shift · view report
                </button>
              </div>
              <span className="chevcol flip" aria-hidden="true" />
            </div>

            <div className="bumper" aria-hidden="true">
              <span className="tail" />
              <span className="chev" />
              <span className="tail" />
            </div>

            <div className="footer">
              {BANK_IS_PLACEHOLDER && (
                <p className="demo-note">
                  ⚠ Demo content — the approved Chapter 47 bank file is not loaded; the records
                  shown are clearly marked placeholders, not medical content.
                </p>
              )}
              <p>
                Every Star of Life is earned — correct answers only, never chance. Questions are
                drawn verbatim from your vetted Chapter 47 exam bank. Roll as long as you like.
              </p>
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportOverlay
          stats={{ runs, answered, correct, bestStreak, code3s }}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════ styles ═══════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@700;800&family=Inter:wght@400;600;700&display=swap');

.ss-stage{
  --gun1:#2c343d; --gun2:#4a5561;
  --chrome1:#e7edf2; --chrome2:#67737f;
  --blue:#2a86ff; --red:#e11d2e; --amber:#ffb300; --hivis:#ffd60a; --hivis2:#d10a1a;
  --navy:#0a141e; --navy2:#050c14; --white:#f4f8fc;
  --ink:#16202b; --ink2:#4c5a68; --cyan:#8fd0ff;
  --disp:'Saira Condensed','Arial Narrow',Impact,sans-serif;
  --body:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  min-height:100vh; min-height:100dvh;
  display:flex; justify-content:center; align-items:flex-start;
  padding:16px 8px 46px;
  background:
    radial-gradient(85% 55% at 28% 6%, rgba(225,29,46,.075), transparent 60%),
    radial-gradient(85% 55% at 72% 6%, rgba(42,134,255,.075), transparent 60%),
    radial-gradient(120% 90% at 50% 0%, #0c1117 0%, #04070b 60%, #010204 100%);
  font-family:var(--body); color:var(--white);
  -webkit-font-smoothing:antialiased;
}
.ss-stage *,.ss-stage *::before,.ss-stage *::after{box-sizing:border-box;}
.ss-stage button{font:inherit;}

.rig{ width:100%; max-width:560px; --flash:.9s; }
.rig.heat-warm{ --flash:.62s; }
.rig.heat-blazing{ --flash:.36s; }
.rig.code3{ --flash:.16s; }

/* ── piano-black outer rim with chrome edge light ── */
.frame{
  border-radius:34px; padding:9px;
  background:linear-gradient(180deg, #38424d 0%, #171e26 34%, #0a0e13 70%, #05070a 100%);
  border:1px solid #000;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.32),
    inset 0 -1px 0 rgba(0,0,0,.9),
    inset 2px 0 3px rgba(255,255,255,.07),
    inset -2px 0 3px rgba(0,0,0,.5),
    0 26px 60px rgba(0,0,0,.85),
    0 6px 18px rgba(0,0,0,.6);
  transition:box-shadow .5s ease;
}
.rig.heat-warm .frame{ box-shadow: inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 0 rgba(0,0,0,.9), 0 26px 60px rgba(0,0,0,.85), 0 0 42px rgba(255,179,0,.2); }
.rig.heat-blazing .frame{ box-shadow: inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 0 rgba(0,0,0,.9), 0 26px 60px rgba(0,0,0,.85), 0 0 64px rgba(255,140,0,.38); }
/* jackpot: the whole cabinet glows and pulses — reserved for 3/3 */
.rig.code3 .frame{ animation:cabglow .8s ease-in-out infinite; }
@keyframes cabglow{
  0%,100%{ box-shadow:0 26px 60px rgba(0,0,0,.85), 0 0 46px rgba(225,29,46,.45), 0 0 100px rgba(255,179,0,.24); }
  50%{ box-shadow:0 26px 60px rgba(0,0,0,.85), 0 0 80px rgba(225,29,46,.65), 0 0 150px rgba(255,179,0,.42); }
}

/* ── brushed-metal vehicle face with specular sweep + gold coach line ── */
.shell{
  border-radius:26px; padding:9px 11px 13px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.24) 0%, rgba(255,255,255,0) 26%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.045) 0 1px, rgba(0,0,0,.02) 1px 2px, transparent 2px 4px),
    linear-gradient(180deg, #f0f5f9 0%, #ccd6de 22%, #a2adb9 52%, #808b97 80%, #6c7783 100%);
  border:1px solid #525d68;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.85),
    inset 0 -3px 9px rgba(0,0,0,.4),
    inset 3px 0 7px rgba(255,255,255,.28),
    inset -3px 0 7px rgba(0,0,0,.2),
    0 0 0 1.5px rgba(201,165,76,.4),
    0 0 0 2.5px rgba(0,0,0,.55);
}

/* amber clearance markers along the roof edge */
.markers{ display:flex; justify-content:space-between; padding:2px 18px 8px; }
.mk{
  width:23px; height:9px; border-radius:5px;
  background:
    radial-gradient(45% 40% at 30% 22%, rgba(255,255,255,.85), transparent 60%),
    radial-gradient(120% 170% at 50% 25%, #ffd47a, var(--amber) 55%, #a3410a);
  border:1px solid #4e5864;
  box-shadow:0 0 9px 2px rgba(255,140,40,.55), inset 0 -1px 2px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.4);
  animation:breathe 2.6s ease-in-out infinite;
}
@keyframes breathe{ 0%,100%{opacity:.5; box-shadow:0 0 4px 1px rgba(255,140,40,.25);} 50%{opacity:1; box-shadow:0 0 11px 3px rgba(255,140,40,.65);} }

/* ── box-body header — the marquee dominates ── */
.head{
  display:grid; grid-template-columns:minmax(70px,86px) 1fr minmax(96px,110px);
  gap:9px; align-items:stretch; padding-bottom:10px;
}
.head-l{ display:flex; flex-direction:column; gap:9px; }
.corner-lamp{
  display:block; height:34px; border-radius:9px;
  background:
    radial-gradient(50% 45% at 30% 20%, rgba(255,255,255,.7), transparent 55%),
    repeating-linear-gradient(90deg, transparent 0 7px, rgba(0,0,0,.28) 7px 9px),
    radial-gradient(120% 160% at 50% 20%, #ff6b74, var(--red) 55%, #6e0410);
  border:2px solid #4e5864;
  box-shadow:inset 0 2px 3px rgba(255,255,255,.4), inset 0 -3px 6px rgba(0,0,0,.6), 0 0 14px rgba(225,29,46,.5), 0 1px 0 rgba(255,255,255,.4);
}
.head-r{ display:flex; flex-direction:column; gap:9px; }

/* illuminated glass gauge tiles */
.gauge{
  position:relative; overflow:hidden;
  flex:1; display:flex; flex-direction:column; justify-content:center;
  border-radius:12px; padding:7px 4px;
  background:
    radial-gradient(90% 70% at 50% 100%, rgba(30,90,160,.22), transparent 65%),
    linear-gradient(180deg, #0d1a29, #030910);
  border:1px solid #39434f;
  box-shadow:
    inset 0 2px 9px rgba(0,0,0,.95),
    inset 0 0 24px rgba(25,70,130,.16),
    0 1px 0 rgba(255,255,255,.55),
    0 0 0 2px rgba(15,20,26,.9),
    0 3px 6px rgba(0,0,0,.45);
  text-align:center;
}
.gauge::after{
  content:""; position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  background:linear-gradient(115deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.02) 30%, transparent 45%);
}
.g-value{
  display:flex; align-items:center; justify-content:center; gap:6px;
  font-family:var(--disp); font-weight:800; font-size:23px; line-height:1;
  color:var(--cyan); text-shadow:0 0 7px rgba(110,190,255,.9), 0 0 20px rgba(60,140,230,.55);
}
.g-label{
  display:block; margin-top:3px;
  font-family:var(--disp); font-weight:700; font-size:9px; letter-spacing:.18em;
  text-transform:uppercase; color:#8b9aac;
}
.gauge.hot .g-value{ color:#ff9d2e; text-shadow:0 0 8px rgba(255,140,0,.95), 0 0 24px rgba(255,100,0,.6); }
.head-l .gauge .g-value{ font-size:27px; flex-direction:column; gap:5px; }
.g-coin{
  width:23px; height:23px; border-radius:50%;
  background:
    radial-gradient(40% 35% at 32% 25%, rgba(255,255,255,.95), transparent 55%),
    radial-gradient(circle at 35% 30%, #ffe9a8, #e0a400 55%, #8a5d00);
  border:1px solid #6e5200;
  box-shadow:inset 0 -2px 3px rgba(0,0,0,.55), 0 0 10px rgba(255,179,0,.6), 0 1px 1px rgba(0,0,0,.5);
}

/* marquee — backlit lightbox with sheen sweep */
.marquee{
  position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;
  border-radius:16px; padding:15px 10px 11px;
  background:
    radial-gradient(85% 62% at 50% 36%, rgba(255,110,40,.15), transparent 68%),
    radial-gradient(120% 90% at 50% 108%, rgba(25,70,130,.3), transparent 60%),
    linear-gradient(170deg, #13273c 0%, #0a1828 42%, #030910 100%);
  border:2px solid #39434f;
  box-shadow:
    inset 0 0 0 2px rgba(220,235,250,.09),
    inset 0 5px 18px rgba(0,0,0,.9),
    inset 0 0 70px rgba(18,55,105,.28),
    0 1px 0 rgba(255,255,255,.55),
    0 0 0 2px rgba(15,20,26,.9),
    0 3px 7px rgba(0,0,0,.5);
  text-align:center;
}
.marquee::before{ /* slow sheen pass across the glass */
  content:""; position:absolute; top:-25%; bottom:-25%; left:-45%; width:36%;
  background:linear-gradient(105deg, transparent 0%, rgba(255,255,255,.11) 50%, transparent 100%);
  transform:skewX(-18deg); pointer-events:none;
  animation:sheen 7s ease-in-out infinite;
}
@keyframes sheen{ 0%,58%{ left:-45%; } 82%,100%{ left:118%; } }
.marquee::after{
  content:""; position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  background:linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.02) 24%, transparent 40%);
}
.title{
  margin:0; display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap;
  font-family:var(--disp); font-weight:800; font-size:clamp(22px,6.5vw,33px);
  letter-spacing:.065em; line-height:1; color:#ffdca8;
  text-shadow:0 0 5px rgba(255,170,60,.95), 0 0 16px rgba(255,110,40,.8), 0 0 36px rgba(225,29,46,.55), 0 2px 2px rgba(0,0,0,.8);
  animation:marqueebreathe 3.4s ease-in-out infinite;
}
@keyframes marqueebreathe{
  0%,100%{ text-shadow:0 0 5px rgba(255,170,60,.95), 0 0 16px rgba(255,110,40,.8), 0 0 36px rgba(225,29,46,.55), 0 2px 2px rgba(0,0,0,.8); }
  50%{ text-shadow:0 0 6px rgba(255,190,90,1), 0 0 24px rgba(255,130,50,.95), 0 0 52px rgba(225,29,46,.75), 0 2px 2px rgba(0,0,0,.8); }
}
.title .amb{ width:42px; flex:0 0 auto; filter:drop-shadow(0 0 7px rgba(255,157,46,.7)); }
.sub{
  margin-top:3px;
  font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.28em;
  text-transform:uppercase; color:#f7efdf; text-shadow:0 0 12px rgba(255,226,184,.65), 0 1px 1px rgba(0,0,0,.7);
}
.mq-div{
  display:block; width:74%; height:2px; margin:9px 0 8px; border-radius:2px;
  background:linear-gradient(90deg, transparent, rgba(160,190,220,.55) 18%, rgba(160,190,220,.55) 82%, transparent);
  box-shadow:0 0 8px rgba(140,180,220,.35);
}
.chap{
  font-family:var(--disp); font-weight:800; font-size:18px; letter-spacing:.26em;
  text-transform:uppercase; color:var(--amber);
  text-shadow:0 0 8px rgba(255,179,0,.8), 0 0 22px rgba(255,140,0,.45), 0 1px 1px rgba(0,0,0,.7);
}
.chap2{
  font-family:var(--disp); font-weight:700; font-size:14px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--amber);
  text-shadow:0 0 8px rgba(255,179,0,.7), 0 1px 1px rgba(0,0,0,.7);
}
.plate{
  margin-top:8px; font-family:var(--disp); font-weight:800; font-size:11px; letter-spacing:.14em;
  color:#141b22; padding:3px 11px; border-radius:5px;
  background:linear-gradient(180deg, #f4f8fc 0%, #c3ccd6 45%, #8d98a4 90%, #a9b3bd 100%);
  border:1px solid #39434f;
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 3px rgba(0,0,0,.3), 0 2px 4px rgba(0,0,0,.65);
  text-shadow:0 1px 0 rgba(255,255,255,.5);
}

/* ── light-bar pod between marquee and cab ── */
.lightbar{ position:relative; z-index:2; display:flex; justify-content:center; margin:2px 0 -7px; }
.lb-shell{
  display:flex; align-items:center; justify-content:center; gap:7px;
  width:min(66%,330px); padding:6px 11px; border-radius:10px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.14) 0%, transparent 32%),
    linear-gradient(180deg, #454f5a 0%, #1c232b 55%, #0d1218 100%);
  border:1px solid #05080b;
  box-shadow:
    0 4px 10px rgba(0,0,0,.7),
    0 0 22px rgba(225,29,46,.12),
    0 0 22px rgba(42,134,255,.12),
    inset 0 1px 0 rgba(255,255,255,.22),
    inset 0 -2px 4px rgba(0,0,0,.6);
}
.lb-cluster{ display:flex; gap:3px; }
.led{ width:9px; height:16px; border-radius:3px; border:1px solid rgba(0,0,0,.5); }
.lb-cluster.red .led{
  background:
    radial-gradient(45% 30% at 32% 18%, rgba(255,255,255,.9), transparent 60%),
    radial-gradient(circle at 50% 25%, #ff9aa0, var(--red) 55%, #7c0812);
  color:var(--red); animation:lbflash var(--flash) linear infinite;
}
.lb-cluster.blue .led{
  background:
    radial-gradient(45% 30% at 32% 18%, rgba(255,255,255,.9), transparent 60%),
    radial-gradient(circle at 50% 25%, #a5cbff, var(--blue) 55%, #0c3f85);
  color:var(--blue); animation:lbflash var(--flash) linear infinite;
  animation-delay:calc(var(--flash) / -2);
}
@keyframes lbflash{
  0%,42%{ opacity:1; filter:brightness(1.7) drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor); }
  50%,92%{ opacity:.22; filter:none; }
  100%{ opacity:1; }
}
.lb-center{
  width:32px; height:18px; border-radius:4px;
  background:linear-gradient(180deg, #f4f8fc, #98a3ae 65%, #67737f);
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 3px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.6);
}
.lightbar.rave .led{ filter:saturate(1.5); }

/* ── cab zone: glass-tube pillar strips outside the cab ── */
.cabzone{
  display:grid; grid-template-columns:13px minmax(0,1fr) 13px; gap:7px; align-items:stretch;
}
.strip{
  border-radius:10px; margin:18px 0 26px;
  background:
    linear-gradient(90deg, rgba(255,255,255,.32), rgba(255,255,255,0) 55%),
    repeating-linear-gradient(180deg, currentColor 0 9px, #070d16 9px 15px);
  border:1px solid rgba(0,0,0,.65);
  animation:strobe var(--flash) linear infinite;
}
.strip.left{ color:var(--blue); box-shadow:0 0 15px rgba(42,134,255,.65), inset 0 0 4px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.25); }
.strip.right{ color:var(--red); box-shadow:0 0 15px rgba(225,29,46,.7), inset 0 0 4px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.25);
  animation-delay:calc(var(--flash) / -2); }
@keyframes strobe{ 0%,45%{ opacity:1; } 50%,95%{ opacity:.4; } 100%{ opacity:1; } }

/* the brushed-metal cab: one mass — windshield bay + cowl */
.cab{
  border-radius:28px 28px 18px 18px; padding:12px 11px 10px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.2) 0%, rgba(255,255,255,0) 30%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, #e3eaf0 0%, #b6c0c9 35%, #929daa 70%, #7e8995 100%);
  border:1px solid #4e5864;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.8),
    inset 0 -3px 8px rgba(0,0,0,.35),
    0 6px 16px rgba(0,0,0,.55),
    0 1px 0 rgba(255,255,255,.15);
}
/* near-black reel bay with corner rivets */
.bayinset{
  position:relative; overflow:hidden;
  display:grid; grid-template-columns:repeat(3,1fr); gap:10px;
  border-radius:18px 18px 12px 12px; padding:12px;
  background:linear-gradient(180deg, #1d232b 0%, #0e1319 55%, #06090d 100%);
  border:1px solid #000;
  box-shadow:
    inset 0 5px 16px rgba(0,0,0,.95),
    inset 0 -1px 0 rgba(255,255,255,.06),
    inset 0 1px 0 rgba(255,255,255,.05),
    0 1px 0 rgba(255,255,255,.35);
}
.rivet{
  position:absolute; width:7px; height:7px; border-radius:50%; z-index:1;
  background:radial-gradient(circle at 35% 30%, #f4f8fc, #808b97 55%, #2c343d);
  box-shadow:0 1px 2px rgba(0,0,0,.8), inset 0 -1px 1px rgba(0,0,0,.5);
}
.rivet.r1{ top:6px; left:7px; } .rivet.r2{ top:6px; right:7px; }
.rivet.r3{ bottom:6px; left:7px; } .rivet.r4{ bottom:6px; right:7px; }
.bayinset.winflash{ animation:winflash ${T.FLASH_MS}ms ease-out; }
@keyframes winflash{
  0%{ box-shadow:inset 0 5px 16px rgba(0,0,0,.95), 0 0 0 rgba(255,179,0,0); }
  30%{ box-shadow:inset 0 5px 16px rgba(0,0,0,.95), 0 0 36px 8px rgba(255,179,0,.9); }
  100%{ box-shadow:inset 0 5px 16px rgba(0,0,0,.95), 0 0 0 rgba(255,179,0,0); }
}

/* premium glass reel windows */
.pane{
  position:relative; aspect-ratio:10/11; border-radius:12px; overflow:hidden;
  background:
    radial-gradient(130% 95% at 50% 118%, rgba(22,65,120,.3), transparent 55%),
    linear-gradient(rgba(140,190,240,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140,190,240,.05) 1px, transparent 1px),
    radial-gradient(150% 130% at 50% -8%, #0d1e30 0%, #06111d 52%, #020810 100%);
  background-size:100% 100%, 15px 15px, 15px 15px, 100% 100%;
  border:2px solid #4e5864;
  box-shadow:
    inset 0 7px 18px rgba(0,0,0,.95),
    inset 0 -3px 10px rgba(0,0,0,.7),
    inset 0 1px 0 rgba(255,255,255,.1),
    0 1px 0 rgba(255,255,255,.22),
    0 0 0 1px #0a0e13;
  display:flex; align-items:center; justify-content:center;
}
.pane::after{ /* curved glass reflections */
  content:""; position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(115deg, rgba(255,255,255,.17) 0%, rgba(255,255,255,.03) 24%, transparent 38%),
    linear-gradient(295deg, rgba(255,255,255,.06) 0%, transparent 20%);
}
.coin{
  font-family:var(--disp); font-weight:800; font-size:clamp(22px,7vw,31px); color:var(--amber);
  text-shadow:0 0 8px rgba(255,179,0,.7), 0 0 24px rgba(255,140,0,.4), 0 2px 2px rgba(0,0,0,.8);
}
.glyph{
  font-size:clamp(26px,8vw,38px); color:#bcd6f2; filter:blur(2px); opacity:.85;
  text-shadow:0 0 14px rgba(120,180,240,.6);
}
.q{ font-family:var(--disp); font-weight:800; font-size:clamp(30px,9vw,46px); }
.q.bright{ color:#ffe2b8; text-shadow:0 0 8px rgba(255,179,0,.95), 0 0 24px rgba(255,157,46,.7); animation:qpulse 1.1s ease-in-out infinite; }
.q.dim{ color:#9cc6ff; opacity:.55; text-shadow:0 0 14px rgba(90,150,220,.6); animation:qwait 2.8s ease-in-out infinite; }
@keyframes qpulse{ 0%,100%{opacity:1;} 50%{opacity:.55;} }
@keyframes qwait{ 0%,100%{opacity:.4;} 50%{opacity:.65;} }

/* the reel being answered right now: still spinning, brighter pane,
   subtle pulse, wake-in (pane-pending is the reduced-motion variant) */
.pane-live,
.pane-pending{
  border-color:var(--amber);
  background:
    radial-gradient(130% 95% at 50% 118%, rgba(120,80,20,.28), transparent 55%),
    linear-gradient(rgba(170,200,235,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(170,200,235,.07) 1px, transparent 1px),
    radial-gradient(150% 130% at 50% -8%, #17293c 0%, #0c1a2a 52%, #061020 100%);
  background-size:100% 100%, 15px 15px, 15px 15px, 100% 100%;
  animation:panewake .3s ease-out, panepulse 1.6s ease-in-out .3s infinite;
}
@keyframes panewake{ 0%{ filter:brightness(.7); } 100%{ filter:brightness(1); } }
@keyframes panepulse{
  0%,100%{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), 0 0 12px rgba(255,179,0,.4); }
  50%{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), 0 0 24px rgba(255,179,0,.75); }
}
/* locked results glow inside their glass */
.pane-star{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), inset 0 0 34px rgba(42,134,255,.22), 0 1px 0 rgba(255,255,255,.22); }
.pane-flat{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), inset 0 0 26px rgba(120,20,30,.16), 0 1px 0 rgba(255,255,255,.22); }

.sol{ width:72%; height:auto; }
.sol .sol-bar{ fill:var(--blue); }
.sol .sol-hub{ fill:#0d2c55; stroke:#9cc6ff; stroke-width:2.5; }
.sol .sol-rod,.sol .sol-snake{ fill:none; stroke:#dceaff; stroke-width:4; stroke-linecap:round; }
.sol.lit{ animation:ignite .45s cubic-bezier(.2,1.6,.4,1); filter:drop-shadow(0 0 10px rgba(42,134,255,1)) drop-shadow(0 0 26px rgba(255,179,0,.7)); }
.sol.lit .sol-bar{ fill:#4d9dff; }
@keyframes ignite{ 0%{ transform:scale(.25); opacity:0; } 60%{ transform:scale(1.12); opacity:1; } 100%{ transform:scale(1); } }

.flatx{ width:82%; height:auto; }
.flatx .ecg{ fill:none; stroke:#a9c4d8; stroke-width:3.4; stroke-linecap:round; stroke-linejoin:round; opacity:.8;
  stroke-dasharray:220; stroke-dashoffset:220; animation:draw .5s ease-out forwards; }
.flatx .xs{ fill:none; stroke:var(--red); stroke-width:9; stroke-linecap:round;
  stroke-dasharray:80; stroke-dashoffset:80; animation:draw .32s ease-in .3s forwards;
  filter:drop-shadow(0 0 6px rgba(225,29,46,.5)); }
@keyframes draw{ to{ stroke-dashoffset:0; } }

.flare{
  position:absolute; inset:-40px; pointer-events:none; border-radius:50%;
  background:radial-gradient(circle, rgba(255,179,0,.55) 0%, rgba(225,29,46,.28) 40%, transparent 70%);
  animation:flare 1.1s ease-out forwards;
}
@keyframes flare{ 0%{ opacity:0; transform:scale(.3);} 35%{opacity:1;} 100%{ opacity:0; transform:scale(1.5);} }

/* cowl: vents · chrome-collared mechanical action button · dome knob */
.console{ display:flex; align-items:center; gap:11px; margin-top:12px; padding:0 3px; }
.vents{
  flex:0 0 auto; width:46px; height:27px; border-radius:5px;
  background:repeating-linear-gradient(180deg, #2c343d 0 3.5px, #aeb8c2 3.5px 5px, #808b97 5px 8px);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.4);
}
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  flex:1; min-width:0; min-height:58px; padding:12px 10px; border-radius:999px; cursor:pointer;
  white-space:nowrap;
  font-family:var(--disp); font-weight:800; font-size:19px; letter-spacing:.07em;
  color:var(--white); border:0;
  transition:transform .06s ease, filter .15s ease;
}
.btn:focus-visible{ outline:3px solid #c77800; outline-offset:5px; }
.btn:disabled{ filter:grayscale(.55) brightness(.72); cursor:default; animation:none; }
.respond{
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.32), transparent 45%),
    linear-gradient(180deg, #ff5560 0%, #d5121f 44%, #96101c 78%, #6f0812 100%);
  text-shadow:0 1px 2px rgba(0,0,0,.8), 0 0 10px rgba(120,10,20,.6);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 7px 0 #55060e,
    0 13px 24px rgba(0,0,0,.65),
    inset 0 2px 1px rgba(255,255,255,.55),
    inset 0 -11px 16px rgba(0,0,0,.45);
}
.respond:not(:disabled){ animation:beckon 2.4s ease-in-out infinite; }
@keyframes beckon{
  0%,100%{ filter:drop-shadow(0 0 6px rgba(255,60,70,.25)); }
  50%{ filter:drop-shadow(0 0 16px rgba(255,60,70,.6)); }
}
.respond:active:not(:disabled){
  transform:translateY(5px);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 2px 0 #55060e,
    0 6px 12px rgba(0,0,0,.55),
    inset 0 2px 1px rgba(255,255,255,.4),
    inset 0 -6px 12px rgba(0,0,0,.5);
}
.runback{
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.5), transparent 45%),
    linear-gradient(180deg, #5ea4ff 0%, var(--blue) 44%, #145bb6 78%, #0c3a7c 100%);
  text-shadow:0 1px 1px rgba(0,0,0,.6), 0 0 14px rgba(140,190,255,.5);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 7px 0 #082f66,
    0 13px 24px rgba(0,0,0,.65),
    inset 0 2px 1px rgba(255,255,255,.55),
    inset 0 -11px 16px rgba(0,0,0,.45);
}
.runback:active{
  transform:translateY(5px);
  box-shadow:0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864, 0 2px 0 #082f66, 0 6px 12px rgba(0,0,0,.55), inset 0 2px 1px rgba(255,255,255,.4), inset 0 -6px 12px rgba(0,0,0,.5);
}
.restock{
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.6), transparent 45%),
    linear-gradient(180deg, #ffd166 0%, var(--amber) 44%, #c07f00 78%, #8a5d00 100%);
  color:#241a06; text-shadow:0 1px 0 rgba(255,255,255,.35);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 7px 0 #5f4300,
    0 13px 24px rgba(0,0,0,.65),
    inset 0 2px 1px rgba(255,255,255,.6),
    inset 0 -11px 16px rgba(0,0,0,.35);
}
.restock:active{
  transform:translateY(5px);
  box-shadow:0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864, 0 2px 0 #5f4300, 0 6px 12px rgba(0,0,0,.55), inset 0 2px 1px rgba(255,255,255,.5), inset 0 -6px 12px rgba(0,0,0,.4);
}
.dome-knob{
  flex:0 0 auto; width:38px; height:38px; border-radius:50%;
  background:
    radial-gradient(40% 32% at 32% 24%, rgba(255,255,255,.95), transparent 55%),
    radial-gradient(circle at 35% 28%, #ffb3b8, #d81525 55%, #6e0410);
  border:2px solid #67737f;
  box-shadow:0 0 12px rgba(255,60,70,.65), inset 0 -4px 6px rgba(0,0,0,.55), 0 4px 6px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.4);
}
.hood-lamps{ display:flex; align-items:center; gap:10px; margin-top:11px; }
.turn{
  flex:0 0 auto; width:34px; height:11px; border-radius:5px;
  background:
    radial-gradient(45% 40% at 30% 22%, rgba(255,255,255,.7), transparent 60%),
    radial-gradient(120% 160% at 50% 25%, #ff6b74, var(--red) 60%, #6e0410);
  border:1px solid #4e5864;
  box-shadow:inset 0 -1px 2px rgba(0,0,0,.55), 0 0 8px rgba(225,29,46,.5), 0 1px 0 rgba(255,255,255,.35);
}
.subtext{
  flex:1; text-align:center; font-size:13px; font-weight:600; color:#2b3540;
  text-shadow:0 1px 0 rgba(255,255,255,.55); min-height:18px;
}

/* ── body bay: run-sheet recessed under a chrome lip, gloss chevron rails ── */
.bay{
  margin-top:11px;
  display:grid; grid-template-columns:17px minmax(0,1fr) 17px; gap:9px; align-items:stretch;
}
.chevcol{
  border-radius:8px;
  background-color:#39424c;
  background-image:
    linear-gradient(90deg, rgba(255,255,255,.16), rgba(255,255,255,0) 55%),
    repeating-linear-gradient(45deg, transparent 0 7px, #10161d 7px 14px),
    repeating-linear-gradient(135deg, transparent 0 7px, #10161d 7px 14px);
  background-size:100% 100%, 50% 100%, 50% 100%;
  background-position:left top, left top, right top;
  background-repeat:no-repeat;
  border:1px solid #1a2129;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18), inset 0 -3px 5px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.25);
}
.chevcol.flip{
  background-image:
    linear-gradient(90deg, rgba(255,255,255,0) 45%, rgba(255,255,255,.16)),
    repeating-linear-gradient(135deg, transparent 0 7px, #10161d 7px 14px),
    repeating-linear-gradient(45deg, transparent 0 7px, #10161d 7px 14px);
  background-position:right top, right top, left top;
}
.sheet{
  position:relative;
  border-radius:13px; padding:15px 15px 11px;
  background:linear-gradient(180deg, #fdfeff 0%, #edf1f5 100%);
  border:1px solid #808b97;
  box-shadow:
    0 0 0 3px #c3ccd6, 0 0 0 4.5px #4e5864,
    0 7px 16px rgba(0,0,0,.5),
    inset 0 1px 0 #fff;
  color:var(--ink);
}
.sheet::after{ /* the paper sits recessed behind the cabinet lip */
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  box-shadow:
    inset 0 14px 22px -14px rgba(10,22,38,.55),
    inset 0 -12px 20px -16px rgba(10,22,38,.45),
    inset 3px 0 10px -8px rgba(10,22,38,.35),
    inset -3px 0 10px -8px rgba(10,22,38,.35);
}

.paytable{ max-width:330px; margin:0 auto; }
.pt-title{
  font-family:var(--disp); font-weight:800; letter-spacing:.18em; text-transform:uppercase;
  color:#b3121f; text-align:center; font-size:15px; padding-bottom:8px;
  text-shadow:0 1px 0 rgba(255,255,255,.8);
}
.pt-row{
  display:flex; justify-content:space-between; gap:12px; padding:7px 10px;
  border-top:1px solid #d3dae1; font-size:14px; color:#223140;
}
.pt-stars{ font-weight:600; }
.pt-pay.plus{ color:#9c6b00; font-family:var(--disp); font-weight:800; font-size:15px; letter-spacing:.06em; }
.pt-pay{ color:var(--ink2); }

/* question card (on the run sheet) */
.qcard{ text-align:left; }
.q-head{
  display:flex; align-items:baseline; gap:10px; padding-bottom:8px;
  border-bottom:2px solid #2b4257; margin-bottom:11px;
}
.q-title{
  font-family:var(--disp); font-weight:700; font-size:15px; letter-spacing:.07em;
  text-transform:uppercase; color:var(--ink);
}
.tagword{ font-style:normal; }
.tagword.dispatch{ color:#b3121f; }
.tagword.protocol{ color:#1766cc; }
.hy{
  margin-left:auto; flex:0 0 auto;
  font-family:var(--disp); font-weight:700; font-size:12px; letter-spacing:.14em;
  color:#67737f;
}
.prompt{
  margin:0 0 14px; font-size:16px; line-height:1.5; font-weight:500; color:var(--ink);
  overflow-wrap:break-word;
}
.reelpre{ font-weight:700; }
.opts{ display:grid; gap:9px; }
.opt{
  display:flex; align-items:center; gap:11px; width:100%; min-height:52px; padding:10px 12px;
  text-align:left; border-radius:10px; cursor:pointer;
  background:linear-gradient(180deg, #ffffff, #f1f4f8);
  border:1px solid #b3bdc7; color:var(--ink);
  font-size:15px; line-height:1.4;
  box-shadow:0 2px 3px rgba(20,32,44,.12), inset 0 1px 0 #fff;
  transition:border-color .15s ease, background .15s ease, box-shadow .15s ease;
  overflow-wrap:anywhere;
}
.opt:hover:not(:disabled){ border-color:#5f6a76; box-shadow:0 3px 6px rgba(20,32,44,.18), inset 0 1px 0 #fff; }
.opt:focus-visible{ outline:3px solid #c77800; outline-offset:2px; }
.opt:disabled{ cursor:default; opacity:.75; }
.opt .key{
  flex:0 0 auto; width:27px; height:27px; border-radius:7px;
  display:inline-flex; align-items:center; justify-content:center;
  font-family:var(--disp); font-weight:800; font-size:14px; color:#223140;
  background:linear-gradient(180deg, #f6f9fb, #d5dde4 60%, #c3ccd6);
  border:1px solid #9aa5b1;
  box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,.2);
  text-shadow:0 1px 0 rgba(255,255,255,.7);
}
.opt.hit{ border-color:var(--blue); background:linear-gradient(180deg, #f3f8ff, #e3efff); box-shadow:0 0 14px rgba(42,134,255,.35), inset 0 1px 0 #fff; opacity:1; }
.opt.miss{ border-color:var(--red); background:linear-gradient(180deg, #fff5f6, #fdeaec); opacity:1; }

/* result (on the run sheet) */
.result{ text-align:center; }
.banner{
  font-family:var(--disp); font-weight:800; letter-spacing:.09em; text-transform:uppercase;
  font-size:20px; line-height:1.25; padding:11px 8px; border-radius:10px;
}
.banner.s3{
  color:#fff; font-size:24px;
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.35), transparent 45%),
    linear-gradient(180deg, #ff3947, var(--red) 55%, #a30f1c);
  border:1px solid #7c0812;
  box-shadow:0 0 24px rgba(225,29,46,.45), inset 0 1px 0 rgba(255,255,255,.4);
  text-shadow:0 0 14px rgba(255,214,10,.95), 0 1px 1px rgba(0,0,0,.6);
  animation:bannerpulse .8s ease-in-out infinite;
}
@keyframes bannerpulse{ 0%,100%{ filter:brightness(1);} 50%{ filter:brightness(1.3);} }
.banner.s2{ color:#0e4a9c; font-size:20px; background:rgba(42,134,255,.14); border:1.5px solid rgba(42,134,255,.6); box-shadow:0 0 14px rgba(42,134,255,.2); }
.banner.s1{ color:#1d5ba8; font-size:18px; background:rgba(42,134,255,.07); border:1px solid rgba(42,134,255,.35); }
.banner.s0{ color:var(--ink2); font-size:17px; background:#eef2f5; border:1px solid #c6cfd8; }
.payline{
  margin-top:9px; font-family:var(--disp); font-weight:800; font-size:20px; letter-spacing:.08em;
  color:#9c6b00; text-shadow:0 1px 0 rgba(255,255,255,.7);
}
.sweep{ margin-top:8px; font-size:14px; font-weight:600; color:#9c6b00; }
.missrev{ margin-top:15px; text-align:left; }
.mr-head{
  font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.16em;
  text-transform:uppercase; color:#b3121f; padding-bottom:8px;
  border-bottom:1px solid rgba(225,29,46,.3); margin-bottom:10px;
}
.miss{
  border:1px solid #d3dae1; border-left:3px solid var(--red);
  border-radius:8px; padding:10px 12px; margin-bottom:10px;
  background:linear-gradient(180deg, #fff, #f8fafc);
  box-shadow:0 1px 3px rgba(20,32,44,.1);
}
.m-meta{ display:flex; gap:10px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); font-family:var(--disp); font-weight:700; padding-bottom:6px; }
.m-q{ margin:0 0 8px; font-size:14px; line-height:1.5; color:#223140; overflow-wrap:break-word; }
.m-a{ margin:0 0 6px; font-size:14px; color:#0e4a9c; overflow-wrap:break-word; }
.m-a strong{ color:var(--ink); }
.m-exp{ margin:0; font-size:13.5px; line-height:1.55; color:var(--ink2); overflow-wrap:break-word; }

.endshift{
  display:block; margin:14px auto 4px; padding:8px 15px; min-height:40px;
  background:linear-gradient(180deg, #fff, #eef2f6);
  border:1px solid #9aa5b1; border-radius:999px;
  color:var(--ink2); font-size:13px; cursor:pointer;
  box-shadow:0 1px 2px rgba(20,32,44,.15), inset 0 1px 0 #fff;
}
.endshift:hover{ color:var(--ink); border-color:#5f6a76; }
.endshift:focus-visible{ outline:3px solid #c77800; outline-offset:2px; }

/* ── bumper & footer ── */
.bumper{
  margin-top:12px; display:flex; align-items:center; gap:10px;
  padding:8px 10px; border-radius:11px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.45) 0%, transparent 38%),
    linear-gradient(180deg, #f0f5f9, #a2adb9 55%, #6c7783);
  border:1px solid #4e5864;
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 4px rgba(0,0,0,.35), 0 4px 8px rgba(0,0,0,.5);
}
.tail{
  flex:0 0 auto; width:30px; height:15px; border-radius:4px;
  background:
    radial-gradient(45% 40% at 30% 22%, rgba(255,255,255,.8), transparent 60%),
    radial-gradient(circle at 50% 30%, #ff8b93, var(--red) 60%, #7c0812);
  border:1px solid #4e5864;
  box-shadow:0 0 12px 3px rgba(225,29,46,.7), inset 0 -1px 2px rgba(0,0,0,.5);
}
.chev{
  flex:1; height:17px; border-radius:4px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.25), transparent 45%),
    repeating-linear-gradient(115deg, var(--hivis) 0 13px, var(--hivis2) 13px 26px);
  box-shadow:inset 0 1px 2px rgba(0,0,0,.45), inset 0 -1px 2px rgba(0,0,0,.3);
  border:1px solid rgba(0,0,0,.35);
}
.footer{
  margin-top:12px; border-radius:15px; padding:12px 12px 7px;
  background:
    radial-gradient(90% 80% at 50% 120%, rgba(25,70,130,.16), transparent 60%),
    linear-gradient(180deg, rgba(13,24,38,.96), rgba(3,8,14,.98));
  border:1px solid #2c3640;
  box-shadow:inset 0 2px 8px rgba(0,0,0,.85), inset 0 0 0 1px rgba(220,235,250,.05), 0 1px 0 rgba(255,255,255,.35);
  text-align:center;
}
.footer p{ margin:0 0 6px; font-size:11.5px; line-height:1.55; color:#8b9aac; }
.demo-note{ color:var(--amber) !important; }

/* ── report overlay ── */
.overlay{
  position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center;
  padding:18px; background:rgba(2,4,8,.82); backdrop-filter:blur(4px);
}
.report{
  width:100%; max-width:400px; border-radius:18px; padding:22px 18px 18px;
  background:
    radial-gradient(85% 60% at 50% 0%, rgba(30,80,150,.22), transparent 60%),
    linear-gradient(180deg, #13212f, #04090f);
  border:1px solid #39434f;
  box-shadow:
    0 0 0 3px rgba(220,235,250,.06),
    0 24px 60px rgba(0,0,0,.8),
    inset 0 1px 0 rgba(255,255,255,.12);
  text-align:center;
}
.r-title{
  margin:0 0 14px; font-family:var(--disp); font-weight:800; font-size:23px;
  letter-spacing:.2em; color:var(--amber);
  text-shadow:0 0 10px rgba(255,179,0,.6), 0 0 26px rgba(255,140,0,.3);
}
.r-grid{ display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:14px; }
.r-stat{
  border:1px solid #2c3640; border-radius:11px; padding:11px 6px;
  background:linear-gradient(180deg, rgba(18,32,48,.85), rgba(6,12,20,.9));
  box-shadow:inset 0 2px 6px rgba(0,0,0,.7), inset 0 0 18px rgba(25,70,130,.12);
}
.r-num{ display:block; font-family:var(--disp); font-weight:800; font-size:27px; color:var(--cyan); text-shadow:0 0 8px rgba(110,190,255,.7); }
.r-lab{ display:block; margin-top:2px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8b9aac; }
.r-line{ margin:0 0 6px; font-size:14.5px; line-height:1.5; color:#dce5ee; }
.r-always{ margin:0 0 14px; font-size:12.5px; color:#9fb0c0; }
.btn.back{
  width:100%; min-height:52px; font-size:17px;
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.5), transparent 45%),
    linear-gradient(180deg, #5ea4ff 0%, var(--blue) 44%, #145bb6 78%, #0c3a7c 100%);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 6px 0 #082f66, 0 11px 20px rgba(0,0,0,.6),
    inset 0 2px 1px rgba(255,255,255,.55), inset 0 -9px 14px rgba(0,0,0,.45);
  text-shadow:0 1px 1px rgba(0,0,0,.6);
}
.btn.back:active{ transform:translateY(4px); box-shadow:0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864, 0 2px 0 #082f66, 0 5px 10px rgba(0,0,0,.5), inset 0 2px 1px rgba(255,255,255,.4), inset 0 -5px 10px rgba(0,0,0,.5); }
.btn.back:focus-visible{ outline-color:var(--amber); }

/* ── responsive (spec §14) ── */
@media (max-width:420px){
  .head{ grid-template-columns:minmax(60px,74px) 1fr minmax(84px,94px); gap:6px; }
  .title{ font-size:20px; }
  .title .amb{ width:32px; }
  .sub{ font-size:10px; letter-spacing:.2em; }
  .chap{ font-size:14px; letter-spacing:.18em; }
  .chap2{ font-size:11px; letter-spacing:.22em; }
  .g-value{ font-size:19px; }
  .head-l .gauge .g-value{ font-size:22px; }
  .g-coin{ width:18px; height:18px; }
  .g-label{ font-size:7.5px; letter-spacing:.1em; }
  .btn{ font-size:14px; min-height:54px; letter-spacing:.05em; padding:10px 6px; gap:6px; }
  .vents{ width:30px; }
  .dome-knob{ width:32px; height:32px; }
  .console{ gap:7px; }
  .bay{ grid-template-columns:13px minmax(0,1fr) 13px; gap:6px; }
  .cabzone{ grid-template-columns:11px minmax(0,1fr) 11px; gap:5px; }
}
@media (max-width:350px){
  .btn{ font-size:12.5px; letter-spacing:.03em; }
  .vents{ display:none; }
}

/* ── reduced motion (spec §14): calm, fully playable ── */
@media (prefers-reduced-motion: reduce){
  .mk,.led,.strip,.q.bright,.q.dim,.pane-live,.pane-pending,.banner.s3,
  .bayinset.winflash,.sol.lit,.flatx .ecg,.flatx .xs,.flare,
  .rig.code3 .frame,.marquee::before,.title,.respond{ animation:none !important; }
  .flatx .ecg,.flatx .xs{ stroke-dashoffset:0; }
  .flare,.marquee::before{ display:none; }
  .glyph{ filter:none; }
  .btn,.opt{ transition:none; }
}
`;
