ok way of working:

- created presets "pp", "qq", "rr", "ss", "tt", "uu", "vv", "ww", "xx" (corresponding to 1-9, all identical)
- created new project, renamed it to "a1-t1-p1" (a1 for "A1 - Track 1 Pattern Growth")
- save as: "a2-t2-p1"; save as: "a3-t3-p1"; save as: "a4-t4-p1" (for A2-4 - Tracks 2-4 pattern growth. Should all still be empty)
- swap back to "a1-t1-p1".
- choose t1: preset "pp" (which is a drumkit btw), add 1 note on step 1.
- save
- save as: "a1-t1-p2"
- choose t1, switch to pattern 2, preset "qq", add 1 note on step 1. (this now contains pattern 1 as previously created, AND pattern 2 with preset 2)
- save
- save as: "a1-t1-p3"
- choose t1, switch to pattern 3, preset "rr", add 1 note on step 1 (now contains p1, p2, p3, presets pp, qq, rr respectively)
- save
....
repeat for p3-p9
switch to a2-t2-..., repeat for p1-p9
switch to a3-t3-..., repeat for p1-p9
switch to a4-t4-..., repeat for p1-p9

projects created are found under ./projects/
presets used are found under ./presets/

fw version: 1.1.4

there may be some manual errors in the process, please check the projects and presets for accuracy.

what stood out is that sometimes with the p8 and p9 patterns, the kickdrum seemingly didnt want to make a sound anymore. not when manually playing it with the keyboard either.
Maybe problem with presets ww and xx, maybe an OP-XY limit or bug.
