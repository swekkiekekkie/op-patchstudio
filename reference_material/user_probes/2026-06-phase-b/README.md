ok im making more probes:

process:

- create project "b1-t1eng1bar1".
- change only track 1 preset: select engine type, choose 1st, choose 1st custom preset (not factory) that i have.
- fill 1 bar fully with base note (F4 i guess? presets choose a default octave height, but ill always select the note associated with the low F# on my OP-XY, without changing octaves. so the values might differ by 12, fyi. you could mod 12 a bunch of the data and see if there are constant sections, that should be where you want to start looking for the note (maybe, idk))

then ill copy the project (save as) to ....bar2, fill the second bar, save, same for bar3, bar4.
Then ill proceed to eng2, repeat, eng3, repeat, for all eng. Then ill do the same for t2 (or maybe partly), t3, etc,

When im finished, ill make some copies of some of the bar1 projects, and postfix then "a" for alt,
and for those ill change the notes from the F to the F#. This way you could differentiate between the two and possibly get note parsing to work as well.

Ok i discovered something halfway: i started creating them from bar4 downwards, removing one bar at a time.
but then i realized. If you add that bar again, the notes are still there.
Please keep that in mind when analyzing the data. I realized this during b1-t1eng6bar3. have been doing it from eng3 upwards or so. I dont remember. But the first two were created incrementally from bar1 upwards. (b1-t1eng1bar* and b1-t1eng2bar*)
ill do eng7-eng11 upwards again.

oh when doing engine 9 i realized another problem. I clone bar1 projects but and then change the engine and preset, but because the notes are already set, i think the presets' default octave height is ignored. So dont rely on that too much.

the engine types and first presets available are:
1. axis - "nt-accord"
2. dissolve - "nt-cold brew"
3. drum - "nt-aeroplane"
4. epiano - "nt-crowded"
5. hardsync - "nt-cabin pressure"
6. multisampler - "bandpasser" - sadly i dont have any multisampler presets, so this one is factory
7. organ - "nt-castle vania"
8. prism - "nt-blip tips"
9. sampler - "nt-106 bass"
10. simple - "nt-dunce cap"
11. wavetable - "nt-tall drink"


ok yeah this took ages, and its not complete.  but ill let you at it as it is.
i hope you can find something useful in it.

fw version: 1.1.4

projects created are found under ./projects/
presets used are found under ./presets/
