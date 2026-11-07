#loader mekanismcontent

// New Mekanism chemicals: the planet metals' slurries and the gases of Eden's and Umbra's chains
import mods.mekanism.content.builder.GasBuilder;
import mods.mekanism.content.builder.SlurryBuilder;

SlurryBuilder.dirty().tint(0xA9612E).ore(<resource:forge:raw_materials/desh>).build("dirty_desh");
SlurryBuilder.clean().tint(0xD2793A).ore(<resource:forge:raw_materials/desh>).build("clean_desh");
SlurryBuilder.dirty().tint(0x7A4790).ore(<resource:forge:raw_materials/ostrum>).build("dirty_ostrum");
SlurryBuilder.clean().tint(0x9A5BB5).ore(<resource:forge:raw_materials/ostrum>).build("clean_ostrum");
SlurryBuilder.dirty().tint(0x9E2C31).ore(<resource:forge:raw_materials/calorite>).build("dirty_calorite");
SlurryBuilder.clean().tint(0xC8383E).ore(<resource:forge:raw_materials/calorite>).build("clean_calorite");
GasBuilder.builder(<resource:mekanism:liquid/liquid>).tint(0xB7C24A).build("digestive_acid");
GasBuilder.builder(<resource:mekanism:liquid/liquid>).tint(0x5E8C6A).build("dravarium_oxide");
GasBuilder.builder(<resource:mekanism:liquid/liquid>).tint(0x8FE0A8).build("dravarium_hexafluoride");
GasBuilder.builder(<resource:mekanism:liquid/liquid>).tint(0x3FD07A).build("enriched_dravarium");
