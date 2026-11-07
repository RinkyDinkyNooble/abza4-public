// The story's documents: written books found in containers, each with its loot table
// (abza:chests/story/<name>), the mystery codes' parts, the lock notes' wordings and the pilots' cards
//
// ABZA_CODE_PARTS: a mystery code's parts (passcodes.js): fixed, seeded in a range (min to max), a time in
// steps of minutes, or days counted from another part to a day
// ABZA_STORY_DOCS: each document's tier and written book NBT; a {part} in its text is filled when rolled
// ABZA_LOCK_NOTES: the wordings of each lock's note, {code} where its code goes
// ABZA_PILOT_CARDS: a card in about one air drop crate in three
// ABZA_MYSTERIES: each mystery lock's documents outside the lock, its rule first
const ABZA_CODE_PARTS = {
    batch: {"min": 1000, "max": 9999},
    audit_room: {"fixed": "12"},
    member: {"min": 100000, "max": 999999},
    hq_day: {"min": 100, "max": 199},
    headcount: {"min": 11, "max": 39},
    silence: {"daysTo": 210, "of": "hq_day"},
    bearing: {"min": 0, "max": 359},
    window: {"step": 10},
}
const ABZA_STORY_DOCS = {
    museum_report: { tier: 1, nbt: "{title:\"Lab B-2: Final Report\",author:\"Everwell Research\",pages:[\"{\\\"text\\\":\\\"Subject: preserved adult remains, on loan from the collection upstairs. Regenesis applied at forty times the patient dose.\\\\n\\\\nHour 6: tissue repair.\\\\nHour 31: movement in the hands.\\\\nHour 33: subject sat up.\\\"}\",\"{\\\"text\\\":\\\"Containment failed at hour 34. Two staff lost. Basement sealed.\\\\n\\\\nThis report is not to be filed.\\\\n\\\\nSource material: Northern Site N-1. Recommend the launch proceed on schedule.\\\"}\"],resolved:1b}" },
    museum_loan: { tier: 1, nbt: "{title:\"Loan Agreement\",author:\"Museum Board\",pages:[\"{\\\"text\\\":\\\"Item: one preserved adult, from the tomb case in the north gallery.\\\\nBorrower: Everwell Research.\\\\nPurpose: conservation study.\\\\nDuration: indefinite.\\\\n\\\\nIn thanks, the sponsor funds the new wing. The case stays lit and labelled.\\\"}\"],resolved:1b}" },
    clinic_memo: { tier: 1, nbt: "{title:\"Staff Memo: Records\",author:\"Head Office\",pages:[\"{\\\"text\\\":\\\"Head Office sets one records code for every clinic, new each quarter.\\\\n\\\\nThe code: this quarter's Regenesis batch, then the audit room's number.\\\\n\\\\nDo not write it down.\\\\n(Pinned up anyway. Mgr)\\\"}\"],resolved:1b}" },
    clinic_leaflet: { tier: 1, nbt: "{title:\"Your Regenesis Dose\",author:\"Everwell Clinics\",pages:[\"{\\\"text\\\":\\\"Free for members.\\\\n\\\\nYour dose: batch {batch}. Keep this leaflet in case of a recall.\\\\n\\\\nWarmth, hunger and vivid dreams are normal in the first week. They pass.\\\"}\"],resolved:1b}" },
    clinic_fridge_card: { tier: 1, nbt: "{title:\"Cold Chain Card\",author:\"Pharmacy Services\",pages:[\"{\\\"text\\\":\\\"REGENESIS\\\\nBatch {batch}\\\\nThis quarter's allocation.\\\\n\\\\nStore at 2 to 8 degrees. Check the batch before every dose.\\\\n\\\\nMembers only.\\\"}\"],resolved:1b}" },
    clinic_rota: { tier: 1, nbt: "{title:\"Rota, Week 36\",author:\"Clinic Manager\",pages:[\"{\\\"text\\\":\\\"Mon: dose clinic, 8 till 8.\\\\nTue: dose clinic.\\\\nWed: dose clinic. Audit in room {audit_room}, Head Office visiting.\\\\nThu: dose clinic.\\\\nFri: overflow in the car park. Bring coats.\\\"}\"],resolved:1b}" },
    clinic_nurse_note: { tier: 1, nbt: "{title:\"Note\",author:\"J.\",pages:[\"{\\\"text\\\":\\\"Mrs D. back again. Says her husband isn't himself. Doesn't sleep, doesn't feel the cold.\\\\n\\\\nTold her it's the dreams, they pass. Flagged it anyway.\\\\n\\\\nHead Office says it's within the normal range.\\\"}\"],resolved:1b}" },
    nurse_plan: { tier: 1, nbt: "{title:\"Note\",author:\"J.\",pages:[\"{\\\"text\\\":\\\"Mrs D. wasn't the only one. Every case I flag goes to Records and never comes back.\\\\n\\\\nThe batch is on every leaflet. The audit room is down the corridor.\\\\n\\\\nGoing in tonight. J.\\\"}\"],resolved:1b}" },
    nurse_last: { tier: 1, nbt: "{title:\"Note\",author:\"J.\",pages:[\"{\\\"text\\\":\\\"Got in. It's all here: every clinic's cases, every one stamped NOT REPORTABLE.\\\\n\\\\nCopies go to the paper on Tuesday. J.\\\"}\"],resolved:1b}" },
    clinic_reports: { tier: 1, nbt: "{title:\"Adverse Events, Q3\",author:\"Everwell Clinics\",pages:[\"{\\\"text\\\":\\\"Patient, 91: knee cartilage fully regrown in eight days.\\\\n\\\\nPatient, 34: no sleep for nineteen days, no fatigue reported.\\\\n\\\\nPatient, 52: body temperature 31 degrees. Alert. Asking for food.\\\"}\",\"{\\\"text\\\":\\\"Forwarded to Head Office as required.\\\\n\\\\nReply: NOT REPORTABLE.\\\\n\\\\nFile with standard records. Do not discuss with patients.\\\"}\"],resolved:1b}" },
    pharmacy_slip: { tier: 1, nbt: "{title:\"Delivery Note\",author:\"Everwell Logistics\",pages:[\"{\\\"text\\\":\\\"Regenesis, 240 doses.\\\\nBatch {batch}.\\\\nReceived in good order.\\\\n\\\\nDriver's note: queue round the block again, came in the back. Someone asked if I had spare. I don't make it, mate.\\\"}\"],resolved:1b}" },
    premium_letter: { tier: 1, nbt: "{title:\"Your Premium\",author:\"Everwell Health & Life\",pages:[\"{\\\"text\\\":\\\"Dear policyholder,\\\\n\\\\nFrom next month your annual premium rises by 340%.\\\\n\\\\nMembers on the Regenesis programme pay nothing more. Book your free dose today, and stay covered for life.\\\"}\"],resolved:1b}" },
    booking: { tier: 1, nbt: "{title:\"Appointment Confirmed\",author:\"Everwell Clinics\",pages:[\"{\\\"text\\\":\\\"Regenesis, first dose.\\\\nTuesday, 9:40.\\\\n\\\\nBring your member card. Nothing to eat after midnight.\\\\n\\\\nWe look forward to seeing you.\\\"}\"],resolved:1b}" },
    survivor_diary: { tier: 1, nbt: "{title:\"Diary\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"Day 9. The power's still on, which is the worst part. Lights in every house and nobody in them.\\\\n\\\\nWe weren't covered, so we weren't booked. I used to be angry about that.\\\"}\"],resolved:1b}" },
    raider_tally: { tier: 1, nbt: "{title:\"Tally\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"TAKEN\\\\nPharmacy x3 (just the shot, useless)\\\\nGun shop\\\\nTwo crates off the planes, one empty\\\\n\\\\nOWE\\\\nKev, two tins\\\\n\\\\nDON'T\\\\nGo near the boat. They shoot back.\\\"}\"],resolved:1b}" },
    prospero_papers: { tier: 1, nbt: "{title:\"Certificate of Registry\",author:\"Maritime Registry\",pages:[\"{\\\"text\\\":\\\"Vessel: Prospero\\\\nType: private motor yacht\\\\n\\\\nRegistered owner: Everwell Platinum Member No. {member}\\\\n\\\\nOwner's details held by Everwell Concierge.\\\"}\"],resolved:1b}" },
    prospero_letter: { tier: 1, nbt: "{title:\"A letter from Prospero\",author:\"Ines\",pages:[\"{\\\"text\\\":\\\"People on the radio talk about someone who keeps walking into the cities and walking back out. We think that's you.\\\\n\\\\nWe can't. We tried. There are fourteen of us on a boat off the coast, and we're running out of everything you'd find ashore.\\\"}\",\"{\\\"text\\\":\\\"Come to the yacht Prospero. Its light is on every night. [DIRECTIONS]\\\\n\\\\nThis came down with a supply crate. The pilots carry our post, so if it reached you, you're closer than you think.\\\\n\\\\nInes, navigator\\\"}\"],resolved:1b}" },
    hart_log_41: { tier: 2, nbt: "{title:\"Log, Day 41\",author:\"Hart\",pages:[\"{\\\"text\\\":\\\"Day 41. Cradle complete. Casing secured. HQ wants temperatures hourly.\\\\n\\\\nMorale good. The cold is the only enemy.\\\"}\"],resolved:1b}" },
    hart_log_quiet: { tier: 2, nbt: "{title:\"Log\",author:\"Hart\",pages:[\"{\\\"text\\\":\\\"Day {hq_day}. Last traffic from HQ:\\\\nHOLD. SEAL THE FIELD LAB.\\\\n\\\\nAcknowledged. Sealed.\\\\n\\\\nHolding.\\\"}\"],resolved:1b}" },
    hart_log_210: { tier: 2, nbt: "{title:\"Log, Day 210\",author:\"Hart\",pages:[\"{\\\"text\\\":\\\"Day 210. {silence} days without a word from HQ. Rations cut again.\\\\n\\\\nThe men ask when. I tell them: when relieved.\\\"}\"],resolved:1b}" },
    hart_log_212: { tier: 2, nbt: "{title:\"Log, Day 212\",author:\"Hart\",pages:[\"{\\\"text\\\":\\\"Day 212. No reply. Holding the perimeter as ordered.\\\\n\\\\n{headcount} of us left.\\\"}\"],resolved:1b}" },
    radio_pad: { tier: 2, nbt: "{title:\"Radio Pad\",author:\"Signals\",pages:[\"{\\\"text\\\":\\\"Day {hq_day}, 0600\\\\nHQ: HOLD.\\\\n\\\\nDay {hq_day}, 1800\\\\nNo carrier.\\\\n\\\\nEvery day since\\\\nNo carrier.\\\"}\"],resolved:1b}" },
    ration_sheet: { tier: 2, nbt: "{title:\"Rations\",author:\"Quartermaster\",pages:[\"{\\\"text\\\":\\\"Heads: {headcount}\\\\nHalf rations from today.\\\\n\\\\nNo seconds. No exceptions.\\\\nNot even the colonel.\\\\n\\\\nQM\\\"}\"],resolved:1b}" },
    field_lab_door: { tier: 2, nbt: "{title:\"Field Lab\",author:\"Hart\",pages:[\"{\\\"text\\\":\\\"FIELD LAB\\\\nSealed on Head Office's order.\\\\n\\\\nCode: the day HQ went quiet, then how many of us are left.\\\\n\\\\nIf you know both, you're one of us. Hart\\\"}\"],resolved:1b}" },
    private_note: { tier: 2, nbt: "{title:\"Note\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"Tried the lab door again. Sarge says the code is the day and the count. I tried my birthday, the date we landed, the date on Mum's last letter.\\\\n\\\\nHart says if I have to ask, I'm not one of us.\\\"}\"],resolved:1b}" },
    garrison_order: { tier: 2, nbt: "{title:\"Standing Order\",author:\"Site Command\",pages:[\"{\\\"text\\\":\\\"No civilians within the perimeter.\\\\nWarn once.\\\\n\\\\nAuthority: Site Command.\\\\nValid until relieved.\\\"}\"],resolved:1b}" },
    soldier_letter: { tier: 2, nbt: "{title:\"Letter\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"Mum, they say we're here until relieved. Nobody says by who. It's cold, but they feed us.\\\\n\\\\nTell Dad I kept his gloves. I'll post this when the mail runs.\\\"}\"],resolved:1b}" },
    dig_survey: { tier: 2, nbt: "{title:\"Survey: Object N-1\",author:\"Everwell Northern Site\",pages:[\"{\\\"text\\\":\\\"Casing: not of terrestrial make.\\\\nCavity: empty on opening. Contents presumed dispersed into the surrounding ice.\\\\n\\\\nSignal: repeating, every 4.2 seconds.\\\"}\",\"{\\\"text\\\":\\\"Navigation assemblies: twelve, removed for study.\\\\nShipped to: the southern research sites.\\\\n\\\\nNote: the signal did not stop when the cores were removed.\\\"}\"],resolved:1b}" },
    buried_trials: { tier: 2, nbt: "{title:\"Trial Summary: N-1\",author:\"Everwell Northern Site\",pages:[\"{\\\"text\\\":\\\"Animal arm: 31% anomalous. Regrowth, no sleep, cold tolerance.\\\\nHuman arm: 9% anomalous.\\\\nRemainder: no change detected.\\\\n\\\\nHead Office: seal the results. The launch proceeds.\\\"}\",\"{\\\"text\\\":\\\"Staff briefed:\\\\nA. Moreau, site lead\\\\nL. Sato, field biology\\\\nK. Brandt, security\\\\n\\\\nSignatures on file.\\\"}\"],resolved:1b}" },
    lena_north_1: { tier: 2, nbt: "{title:\"Field Notes\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"The ice at the cradle melted in a perfect circle. Not from our heaters. From the inside, outward.\\\\n\\\\nIt wasn't trapped. It was waiting.\\\"}\"],resolved:1b}" },
    lena_north_2: { tier: 2, nbt: "{title:\"Field Notes\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"Cut one sample and the others in the dish close the same wound.\\\\n\\\\nThey share. No. They don't share. They're one sample, in many dishes.\\\"}\"],resolved:1b}" },
    survivor_note_t2: { tier: 2, nbt: "{title:\"Note\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"Walked to the fence to ask for medicine. A soldier said the site was closed by order.\\\\n\\\\nI asked whose. He didn't know.\\\"}\"],resolved:1b}" },
    uplink_checklist: { tier: 3, nbt: "{title:\"Uplink Room\",author:\"Everwell Research\",pages:[\"{\\\"text\\\":\\\"UPLINK ROOM\\\\nAuthorised staff only.\\\\n\\\\nThe door takes tonight's settings: the dish's bearing, then the transmission window (24-hour clock, no colon).\\\\n\\\\nIf you don't know them, you aren't sending.\\\"}\"],resolved:1b}" },
    ops_board: { tier: 3, nbt: "{title:\"Operations\",author:\"Everwell Research\",pages:[\"{\\\"text\\\":\\\"Dish bearing: {bearing}.\\\\nLocked by Head Office. Do not adjust.\\\\n\\\\nCores: in the vault.\\\\nVisitors: none.\\\"}\"],resolved:1b}" },
    uplink_schedule: { tier: 3, nbt: "{title:\"Uplink Schedule\",author:\"Everwell Research\",pages:[\"{\\\"text\\\":\\\"Transmission window: {window} nightly.\\\\nDuration: eleven minutes.\\\\nContent: as authorised.\\\"}\"],resolved:1b}" },
    escort_order: { tier: 3, nbt: "{title:\"Escort Detail\",author:\"Site Command\",pages:[\"{\\\"text\\\":\\\"Take the technicians to the dish nightly. The dish stays on {bearing}.\\\\n\\\\nPurpose: not your concern.\\\"}\"],resolved:1b}" },
    relief_roster: { tier: 3, nbt: "{title:\"Relief Roster\",author:\"Site Command\",pages:[\"{\\\"text\\\":\\\"The dish guard is relieved fifteen minutes before {window}.\\\\n\\\\nNobody stands under it while it sends. That's an order, not advice.\\\"}\"],resolved:1b}" },
    uplink_log: { tier: 3, nbt: "{title:\"Transmission Log\",author:\"Everwell Research\",pages:[\"{\\\"text\\\":\\\"Reply 1\\\\nContent: greeting package; Earth's position; one message: RECEIVED. WE ACCEPT.\\\\n\\\\nAuthorised: Head Office.\\\"}\",\"{\\\"text\\\":\\\"Replies 2 to 40: repeated nightly.\\\\n\\\\nReply 41: acknowledgement received. Transmissions ended.\\\\n\\\\nDo not log acknowledgements. HO\\\"}\"],resolved:1b}" },
    research_memo: { tier: 3, nbt: "{title:\"Memo\",author:\"Head Office\",pages:[\"{\\\"text\\\":\\\"The twelve cores agree on one direction. Head Office has authorised a reply along it.\\\\n\\\\nFrom today, staff will stop calling it the signal. Call it the client.\\\"}\"],resolved:1b}" },
    evacuation_list: { tier: 3, nbt: "{title:\"Lunar Relocation\",author:\"Everwell Research\",pages:[\"{\\\"text\\\":\\\"Keycard holders: report with your cards.\\\\nCards will not be reissued.\\\\n\\\\nVaults stay locked until you return.\\\"}\"],resolved:1b}" },
    researcher_note: { tier: 3, nbt: "{title:\"Note\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"We sent the cores' readings to Head Office and got back one word: proceed.\\\\n\\\\nI keep a bag packed. Nobody's asked me to the Moon.\\\"}\"],resolved:1b}" },
    garrison_order_t3: { tier: 3, nbt: "{title:\"Standing Order\",author:\"Site Command\",pages:[\"{\\\"text\\\":\\\"Research sites are to be held until relieved.\\\\n\\\\nNo relief is scheduled.\\\\n\\\\nThis order does not expire.\\\"}\"],resolved:1b}" },
    pilot_log: { tier: 3, nbt: "{title:\"Sortie Log\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Sortie 88. Flare by the river. Dropped the crate and a kid waved with both arms.\\\\n\\\\nFuel at a third. The Major says that's two more days of waving.\\\"}\"],resolved:1b}" },
    pilot_watch: { tier: 3, nbt: "{title:\"Watch Log\",author:\"B.\",pages:[\"{\\\"text\\\":\\\"Night 30 watching the research site.\\\\n\\\\nThe dish swings to the same heading every night and sends at the same minute. Their guards clear the yard first.\\\\n\\\\nWhoever holds their paperwork holds that door. B.\\\"}\"],resolved:1b}" },
    desert_note: { tier: 3, nbt: "{title:\"Note\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"The flies came first. Then the things the flies came from.\\\\n\\\\nThen the soldiers, who didn't help with either.\\\"}\"],resolved:1b}" },
    manifest: { tier: 4, nbt: "{title:\"Delivery Manifest\",author:\"Station Stores\",pages:[\"{\\\"text\\\":\\\"Private suite, member {member}:\\\\nWine, 12 cases\\\\nCheese, 4 wheels\\\\nHydroponic fruit: full allocation\\\\n\\\\nCrew decks: paste.\\\"}\"],resolved:1b}" },
    crew_rota: { tier: 4, nbt: "{title:\"Shift Rota\",author:\"Station Crew\",pages:[\"{\\\"text\\\":\\\"Air: 4 on, 8 off\\\\nWater: 6 on, 6 off\\\\nHab 3: closed (distributor)\\\\nResidents' wing: on call, all hours\\\\n\\\\nSomeone keeps writing 'gift' on this. Stop it.\\\"}\"],resolved:1b}" },
    crew_complaint: { tier: 4, nbt: "{title:\"Complaint\",author:\"Station Crew\",pages:[\"{\\\"text\\\":\\\"Nature: we were told Earth was gone.\\\\n\\\\nStatus: not accepted.\\\\n\\\\nComment: gift recipients do not file complaints.\\\"}\"],resolved:1b}" },
    luggage_tag: { tier: 4, nbt: "{title:\"Luggage Tag\",author:\"Everwell Concierge\",pages:[\"{\\\"text\\\":\\\"EVERWELL PLATINUM\\\\nMember {member}\\\\nPriority handling\\\\nDo not open\\\"}\"],resolved:1b}" },
    concierge_card: { tier: 4, nbt: "{title:\"Platinum Suites\",author:\"Everwell Concierge\",pages:[\"{\\\"text\\\":\\\"Your suite's safe answers to your member number.\\\\n\\\\nNo codes to remember. No codes to lose.\\\\n\\\\nWelcome home.\\\"}\"],resolved:1b}" },
    crew_safe_note: { tier: 4, nbt: "{title:\"Note\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"His safe says MEMBER ACCESS. We tried our crew numbers, then our birthdays.\\\\n\\\\nEvery crate we haul up for him has a number on it. Somebody write it down next time.\\\"}\"],resolved:1b}" },
    wing_memo: { tier: 4, nbt: "{title:\"Residents' Notice\",author:\"Everwell Concierge\",pages:[\"{\\\"text\\\":\\\"Staff are not to be addressed by name. Requests go through the concierge.\\\\n\\\\nPlease do not tip. Staff are provided for.\\\"}\"],resolved:1b}" },
    julian_log: { tier: 4, nbt: "{title:\"Log\",author:\"J.\",pages:[\"{\\\"text\\\":\\\"Radio: survivors on Earth, calling.\\\\n\\\\nDecision: no reply. A reply invites requests we can't meet.\\\"}\"],resolved:1b}" },
    dose_list: { tier: 4, nbt: "{title:\"Cold Room Inventory\",author:\"Residents' Clinic\",pages:[\"{\\\"text\\\":\\\"Regenesis, resident allocation: 214 doses, each named.\\\\n\\\\nSeals: all intact.\\\\n\\\\nNote: residents opted for Platinum care.\\\"}\"],resolved:1b}" },
    platinum_protocol: { tier: 4, nbt: "{title:\"Platinum Care\",author:\"Residents' Clinic\",pages:[\"{\\\"text\\\":\\\"Resident protocol.\\\\n\\\\nGene-matched repair, given in clinic. Not Regenesis.\\\\n\\\\nNot for general release.\\\\nCost per course: on request.\\\"}\"],resolved:1b}" },
    return_plan: { tier: 4, nbt: "{title:\"Return Plan\",author:\"Everwell\",pages:[\"{\\\"text\\\":\\\"When Earth is safe:\\\\n1. Platinum members.\\\\n2. Gold members, as space allows.\\\\n\\\\nStation Crew: retained until replacements are trained.\\\"}\",\"{\\\"text\\\":\\\"Assets to recover:\\\\nThe cities.\\\\nThe clinics.\\\\nProspero, for the owner's use.\\\\n\\\\nNo one returns early. No one is told.\\\"}\"],resolved:1b}" },
    lena_cinder_1: { tier: 5, nbt: "{title:\"Field Notes: Cinder\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"The murals show it arriving as rain. People kneel in it with their hands open.\\\\n\\\\nNobody here was afraid. It came as a healer. It always comes as a healer.\\\"}\"],resolved:1b}" },
    lena_cinder_2: { tier: 5, nbt: "{title:\"Field Notes: Cinder\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"Every eye on Cinder turns toward whoever is moving.\\\\n\\\\nNot to see. To show. It watches through what it takes, and something farther out watches through it.\\\"}\"],resolved:1b}" },
    lena_cinder_3: { tier: 5, nbt: "{title:\"Field Notes: Cinder\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"The eye core is warm, and it isn't alive. It's a relay.\\\\n\\\\nI wrote 'transmitter' first. Then I crossed it out. I don't want it to be true.\\\"}\"],resolved:1b}" },
    probe_cinder: { tier: 5, nbt: "{title:\"Survey Probe Log\",author:\"Everwell Survey\",pages:[\"{\\\"text\\\":\\\"Survey 1: Cinder.\\\\nAtmosphere: unbreathable.\\\\nBiomass: high, single organism.\\\\nNative life: none remaining.\\\\n\\\\nCommercial potential: medium.\\\\nContinuing on route.\\\"}\"],resolved:1b}" },
    camp_board: { tier: 5, nbt: "{title:\"Camp Board\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Priorities:\\\\n1. Rocket fuel\\\\n2. Oxygen\\\\n3. Ammunition\\\\n4. Coffee\\\\n\\\\nSomeone moved coffee to the top again. It goes back to four.\\\"}\"],resolved:1b}" },
    lena_eden_1: { tier: 6, nbt: "{title:\"Field Notes: Eden\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"Air, rain, day and night. If I squint, it's home.\\\\n\\\\nThat's the frightening part. Nothing here looks wrong until it moves.\\\"}\"],resolved:1b}" },
    lena_eden_2: { tier: 6, nbt: "{title:\"Field Notes: Eden\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"The lungs and the liver came from different creatures, and they're the same tissue.\\\\n\\\\nThere aren't many creatures on Eden. There's one, wearing many.\\\"}\"],resolved:1b}" },
    lena_eden_3: { tier: 6, nbt: "{title:\"Field Notes: Eden\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"Give Earth a hundred years of nobody acting, and it looks like this.\\\\n\\\\nI keep writing that down, as if writing it down were acting.\\\"}\"],resolved:1b}" },
    probe_eden: { tier: 6, nbt: "{title:\"Survey Probe Log\",author:\"Everwell Survey\",pages:[\"{\\\"text\\\":\\\"Survey 2: Eden.\\\\nAtmosphere: breathable.\\\\nBiomass: exceptional, single organism.\\\\n\\\\nCommercial potential: high.\\\\nRecommend a crewed follow-up.\\\\nContinuing on route.\\\"}\"],resolved:1b}" },
    lena_umbra_1: { tier: 7, nbt: "{title:\"Field Notes: Umbra\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"Umbra is a garden that was used up. Nothing grows here now but what was left to tend the seeds.\\\\n\\\\nIt isn't a grave. It's a nursery.\\\"}\"],resolved:1b}" },
    lena_umbra_2: { tier: 7, nbt: "{title:\"Field Notes: Umbra\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"Every seed that fell on Cinder and Eden was grown on worlds like this one.\\\\n\\\\nAnd ours? I think ours was too. I think it came from somewhere close.\\\"}\"],resolved:1b}" },
    lena_umbra_3: { tier: 7, nbt: "{title:\"Field Notes: Umbra\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"I have all twelve cores' readings at last. They don't point here.\\\\n\\\\nThey point home: to the bright thing in our own sky. It answered us. It came to collect.\\\"}\"],resolved:1b}" },
    probe_umbra: { tier: 7, nbt: "{title:\"Survey Probe Log\",author:\"Everwell Survey\",pages:[\"{\\\"text\\\":\\\"Survey 3: Umbra.\\\\nBiomass: depleted.\\\\nCommercial potential: none.\\\\n\\\\nOrigin of seed traffic: next waypoint.\\\\nContinuing on route.\\\\n\\\\nSignal lost.\\\"}\"],resolved:1b}" },
    forward_lab_6: { tier: 8, nbt: "{title:\"Lab Log, Day 6\",author:\"Davi\",pages:[\"{\\\"text\\\":\\\"Day 6. My cough's worse. Dust, probably.\\\\n\\\\nThe samples in my tray have grown toward my side of the bench. I've moved the tray twice.\\\"}\"],resolved:1b}" },
    forward_lab_9: { tier: 8, nbt: "{title:\"Lab Log, Day 9\",author:\"Unknown\",pages:[\"{\\\"text\\\":\\\"Day 9. Davi locked himself in the cold store this morning.\\\\n\\\\nHe keeps knocking. Not trying to get out. Just knocking.\\\\n\\\\nWe're leaving at first light.\\\"}\"],resolved:1b}" },
    lena_interloper_1: { tier: 8, nbt: "{title:\"Field Notes: Interloper\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"It isn't a planet. It's a nest the size of one.\\\\n\\\\nEverything we've fought, on every world, came from something like this.\\\"}\"],resolved:1b}" },
    lena_interloper_2: { tier: 8, nbt: "{title:\"Field Notes: Interloper\",author:\"Lena\",pages:[\"{\\\"text\\\":\\\"If it can notice us, it can choose to leave us.\\\\n\\\\nI don't know how to make it choose. I think we hurt it until it does.\\\"}\"],resolved:1b}" },
}
const ABZA_LOCK_NOTES = {
    safe: [
        { author: "M.", text: "Back soon. Safe's {code}. M." },
        { author: "Mum", text: "If the power's off, the safe still opens. {code}. Passports and cash. Don't wait for us. Love, Mum." },
        { author: "D.", text: "Gran, the papers are in the safe. {code}. We've gone to the coast. D." },
        { author: "Unknown", text: "Safe: {code}. Insurance documents inside. Ha." },
        { author: "P.", text: "Combination's {code}. Dad's watch is in there. Take it if we're not back. P." },
    ],
    door: [
        { author: "Unknown", text: "Spare key's gone. Door code {code}. Feed the cat." },
        { author: "L.", text: "Door's {code}. We went to Aunt Ro's. Come and find us. L." },
        { author: "Unknown", text: "Code {code}. Lock it behind you. I mean it." },
        { author: "Facilities", text: "Deliveries: door code {code}. Inside, not on the step." },
    ],
    vault: [
        { author: "Facilities", text: "Vault access {code}. Changed weekly. Shred this." },
        { author: "Unknown", text: "Night shift: vault's {code}. Don't tell the manager I wrote it down." },
        { author: "Head Office", text: "Temporary vault code {code}. Rotation suspended until further notice." },
        { author: "R.", text: "{code}. Couldn't remember the new one. Writing it here once. R." },
    ],
}
const ABZA_PILOT_CARDS = [
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Fired your flare, got your crate. That's the deal. No charge.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Courtesy of the people who didn't leave.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Not much this run. Better than nothing.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"We see your lights at night. Keep them low.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Boil the water. All of it. Medic's orders.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Fuel's short. Find some, and the boat sends it on to us.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"Flew over twice before you looked up. Stay off the roofs.\\\"}\"],resolved:1b}",
    "{title:\"Pilot's Card\",author:\"Free Air Corps\",pages:[\"{\\\"text\\\":\\\"From the south, with what we could spare.\\\"}\"],resolved:1b}",
]
const ABZA_MYSTERIES = {
    records: ["clinic_memo", "clinic_leaflet", "clinic_fridge_card", "pharmacy_slip", "clinic_rota", "clinic_nurse_note", "nurse_plan"],
    field_lab: ["field_lab_door", "hart_log_41", "hart_log_quiet", "radio_pad", "hart_log_210", "hart_log_212", "ration_sheet", "private_note"],
    uplink: ["uplink_checklist", "ops_board", "escort_order", "uplink_schedule", "relief_roster", "pilot_watch"],
    platinum: ["concierge_card", "prospero_papers", "manifest", "luggage_tag", "crew_safe_note"],
}
const ABZA_AIR_DROP_TABLES = ["dyairdrop:chests/smallairdrop1", "dyairdrop:chests/weaponairdrop1", "dyairdrop:chests/medicalairdrop1", "dyairdrop:chests/smallairdrop2", "dyairdrop:chests/weaponairdrop2", "dyairdrop:chests/medicalairdrop2", "dyairdrop:chests/smallairdrop3", "dyairdrop:chests/weaponairdrop3", "dyairdrop:chests/medicalairdrop3", "dyairdrop:chests/largeairdrop1"]

// A story document as a written book; with a level, its slots filled from that world's code parts
function abzaStoryDoc(name, level) {
    var nbt = ABZA_STORY_DOCS[name].nbt
    if (level) nbt = nbt.replace(/\{([a-z_]+)\}/g, (slot, part) => abzaCodePart(level, part).text)
    return Item.of('minecraft:written_book', nbt)
}

ServerEvents.chestLootTables(event => {
    Object.keys(ABZA_STORY_DOCS).forEach(name => event.addChest(`abza:story/${name}`, table => {}))
})

LootJS.modifiers(event => {
    Object.keys(ABZA_STORY_DOCS).forEach(name => {
        event.addLootTableModifier(`abza:chests/story/${name}`)
            .apply(ctx => ctx.addLoot(LootEntry.of(abzaStoryDoc(name, ctx.getLevel()))))
    })
    ABZA_AIR_DROP_TABLES.forEach(table => {
        event.addLootTableModifier(table).apply(ctx => {
            if (Math.random() >= 1 / 3) return
            var card = ABZA_PILOT_CARDS[Math.floor(Math.random() * ABZA_PILOT_CARDS.length)]
            ctx.addLoot(LootEntry.of(Item.of('minecraft:written_book', card)))
        })
    })
})
