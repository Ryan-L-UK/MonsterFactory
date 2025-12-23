// ---------------------------------------------------------------------------------------------------------
//FUNCTION CHECK SIZE
function checksize(size) {
  var checksize = "";
  var lookup = {
    T: "Tiny",
    S: "Small",
    M: "Medium",
    L: "Large",
    H: "Huge",
    G: "Gargantuan",
  };
  checksize = lookup[size];
  return checksize;
}
// ---------------------------------------------------------------------------------------------------------
//FUNCTION CHECK ALLIGNMENT
function checkalignment(alignment) {
  var checkalignment = "";
  var lookup = {
    C: "Chaotic",
    T: "True",
    L: "Lawful",
    N: "Neutral",
    G: "Good",
    E: "Evil",
    A: "Any Alignment",
    U: "Unaligned",
  };
  checkalignment = lookup[alignment];
  return checkalignment;
}
// ---------------------------------------------------------------------------------------------------------
function checkstatrole(modifier) {
  var output = Math.floor((modifier - 10) / 2);
  var symbol = "";
  if (output >= 0) {
    symbol = "+";
  }
  return modifier + " (" + symbol + output + ")";
}
// ---------------------------------------------------------------------------------------------------------
function checkheader(header) {
  var headerout = "";
  var lookup = {
    "": "Error",
    saves: "Saving Throws:",
    skills: "Skills:",
    resist: "Damage Resistances:",
    immune: "Damage Immunities:",
    vulnerable: "Damage Vulnerabilities:",
    conditionImmune: "Condition Immunities:",
    senses: "Senses:",
    languages: "Languages:",
    innateHeaderEntry: "Innate:",
    spellHeaderEntry: "Spellcasting:",
    atWill: "At will: ",
    daily1e: "1/Day Each: ",
    daily2e: "2/Day Each: ",
    daily3e: "3/Day Each: ",
    cantrip: "Cantrips (at will): ",
    lvl1slots: "1st Level (",
    lvl2slots: "2nd Level (",
    lvl3slots: "3rd Level (",
    lvl4slots: "4th Level (",
    lvl5slots: "5th Level (",
  };
  headerout = lookup[header];
  return headerout;
}
// ---------------------------------------------------------------------------------------------------------
//CREATURE LIST
fetch("http://localhost:8080/Sources/Creatures")
  .then((response) => response.json())
  .then((data) => {
    let missingTypes = [];
    let simpleCopyFlags = [];
    let allCopyFlags = [];
    //-----------------------
    //CREATE TABLE HEADINGS
    const tblParent = document.getElementById("cTable");
    const myTable = document.createElement("table");
    myTable.setAttribute("id", "myTable");
    //-----------------------
    const tblHead = document.createElement("thead");
    tblHead.setAttribute("class", "fixedHead");
    const tblRow = document.createElement("tr");
    //-----------------------
    const tblImage = document.createElement("th");
    tblImage.innerHTML = "Image";
    tblImage.setAttribute("width", "40px");
    //-----------------------
    const tblCName = document.createElement("th");
    tblCName.innerHTML = "Creature Name";
    tblCName.setAttribute("width", "205px");
    //-----------------------
    const tblSize = document.createElement("th");
    tblSize.innerHTML = "Size";
    tblSize.setAttribute("width", "77px");
    //-----------------------
    const tblType = document.createElement("th");
    tblType.innerHTML = "Type";
    tblType.setAttribute("width", "77px");
    //-----------------------
    const tblSource = document.createElement("th");
    tblSource.innerHTML = "Source";
    tblSource.setAttribute("width", "56px");
    //-----------------------
    myTable.appendChild(tblHead);
    tblHead.appendChild(tblRow);
    tblRow.appendChild(tblImage);
    tblRow.appendChild(tblCName);
    tblRow.appendChild(tblSize);
    tblRow.appendChild(tblType);
    tblRow.appendChild(tblSource);
    //-----------------------
    //CREATE TABLE BODY
    const tbodyRef = document.createElement("tbody");
    myTable.appendChild(tbodyRef);
    //-----------------------
    //NAME CHECK & VARIABLE SET
    for (const prop in data) {
      if (data[prop].source.includes("UA") && data[prop].source != "UAWGE") {
        console.warn("Unearthed Arcana: " + data[prop].name);
      }

      //Simple Copies
      if (
        data[prop]._copy !== undefined &&
        Object.keys(data[prop]._copy).length === 2 &&
        data[prop]._copy.hasOwnProperty("name") &&
        data[prop]._copy.hasOwnProperty("source")
      ) {
        simpleCopyFlags.push(data[prop].name + ".json");
      }

      //All Copies
      if (data[prop]._copy != undefined) {
        allCopyFlags.push(data[prop].name + ".json");
      }
      //---------------------

      let creatureName = data[prop].name;
      var newRow = tbodyRef.insertRow();
      //-----------------------
      //CREATURE ICONS
      var newImage = newRow.insertCell();
      var newImageRaw = document.createElement("img");

      newImageRaw.src =
        "http://localhost:8080/EnchantedForge/ImageAssets/CreatureImages/" +
        data[prop].name +
        ".png";
      newImageRaw.setAttribute("class", "ListIcon");
      newImage.appendChild(newImageRaw);
      //-----------------------
      //CREATURE NAME
      var newName = newRow.insertCell();
      const jsonAnchor = document.createElement("a");
      var newNameText = document.createTextNode(creatureName);
      newName.appendChild(jsonAnchor);
      var jsonlink =
        "http://localhost:8080/Pages/CreaturePage.html?FileName=" +
        creatureName;
      jsonAnchor.setAttribute("href", jsonlink);
      jsonAnchor.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        fetchData(creatureName.replace("/", "-"));
      });
      jsonAnchor.appendChild(newNameText);
      newName.setAttribute("class", "bold");
      //-----------------
      //CREATURE SIZE
      var newSize = newRow.insertCell();
      if (data[prop].customIndicator != undefined) {
        var newSizeText = document.createTextNode(
          data[prop].size.charAt(0).toUpperCase() + data[prop].size.slice(1)
        );
      } else if (data[prop].size != undefined) {
        var newSizeText = document.createTextNode(checksize(data[prop].size));
      } else {
        var newSizeText = document.createTextNode("N/A");
      }
      newSize.appendChild(newSizeText);
      //-----------------
      //CREATURE TYPE
      var newType = newRow.insertCell();
      if (data[prop].type != undefined && data[prop].type.type != undefined) {
        var newTypeText = document.createTextNode(
          data[prop].type.type.charAt(0).toUpperCase() +
            data[prop].type.type.slice(1)
        );
      } else if (data[prop].type != undefined) {
        var newTypeText = document.createTextNode(
          data[prop].type.charAt(0).toUpperCase() + data[prop].type.slice(1)
        );
      } else {
        var newTypeText = document.createTextNode("N/A");
        missingTypes.push(data[prop].name);
      }
      newType.appendChild(newTypeText);
      //-----------------------
      //SOURCE BOOK
      var newSource = newRow.insertCell();
      var newSourceText = document.createTextNode(
        data[prop].source.charAt(0).toUpperCase() + data[prop].source.slice(1)
      );
      newSource.appendChild(newSourceText);
      newSource.removeAttribute("class");
      newSource.setAttribute("class", data[prop].source);
    }
    tblParent.appendChild(myTable);
    console.log("----------------------------");
    console.warn("Creatures Missing Types:");
    console.log(missingTypes);
    console.log("----------------------------");
    console.warn("Creatures With Simple _Copy Flags:");
    console.log(simpleCopyFlags);
    console.log("----------------------------");
    console.warn("Creatures With _Copy Flags:");
    console.log(allCopyFlags);
    console.log("----------------------------");
  });
// ---------------------------------------------------------------------------------------------------------
//IMPORT CREATURE
function fetchData(fileName) {
  console.log(
    "Librarians: Looking in the 'Bestiary' section, for '" + fileName + "'"
  );
  document.getElementById("creatureform").reset();
  console.warn("Cleric: Casting Prestidigitation On Form...");
  fetch("http://localhost:8080/Sources/Creatures/" + fileName + ".json")
    .then(function (urlOUTPUT) {
      return urlOUTPUT.text();
    })
    .then(function (etl) {
      const text = etl;
      const obj = JSON.parse(text);
      runETL(obj);
    })
    .then(function () {
      showInput();
    });
}
// ---------------------------------------------------------------------------------------------------------
//IMPORT FROM FILE
async function readText(event) {
  document.getElementById("creatureform").reset();
  console.warn("Cleric: Casting Prestidigitation On Form...");
  const file = event.target.files.item(0);
  const text = await file.text();
  const obj = JSON.parse(text);
  runETL(obj);
}
// ---------------------------------------------------------------------------------------------------------
//EXTRACT TRANSFORM & LOAD
function runETL(obj) {
  //CUSTOM JSON LOADER
  if (obj.customIndicator == "RML") {
    console.warn("Cleric: Summoning Custom Shell");
    console.log(obj);
    for (const prop in obj) {
      console.log(`${obj[prop]}`);
      document.getElementById(`${prop}`).value = `${obj[prop]}`;
    }
    console.warn("Cleric: Summoning Ritual Complete");
  }
  // ---------------------------------------------------------------------------------------------------------
  //JSON CONVERTER
  else {
    console.warn("Cleric: Summoning Converter Shell");
    console.log(obj);
    // ---------------------------------------------------------------------------------------------------------
    if (obj._copy != undefined) {
      alert(
        "This creature has a _copy marker. It data is incomplete, and the load will have failed."
      );
    }
    // ---------------------------------------------------------------------------------------------------------
    var object = {};
    // ---------------------------------------------------------------------------------------------------------
    if (obj.type.type != undefined) {
      var type = obj.type.type;
    } else {
      var type = obj.type;
    }
    if (obj.type.tags != undefined) {
      var tags = obj.type.tags;
    } else {
      var tags = "";
    }
    // ---------------------------------------------------------------------------------------------------------
    if (obj.alignment == undefined) {
      var alignTypeOut = undefined;
    } else if (obj.alignment[0] == "NX") {
      var alignTypeOut = "Any Non-Lawful Alignment";
      var alignClassOut = "";
    } else {
      if (obj.alignment[0] != undefined) {
        var alignTypeOut = checkalignment(obj.alignment[0]);
      } else {
        var alignTypeOut = "";
      }
      if (obj.alignment[1] != undefined) {
        var alignClassOut = checkalignment(obj.alignment[1]);
      } else {
        var alignClassOut = "";
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    // CREATURE SPEED
    if (obj.speed == undefined) {
      var walk = undefined;
    } else {
      if (obj.speed.walk >= 0) {
        var walk = "Walk " + obj.speed.walk + " feet";
      } else {
        var walk = "";
      }
      if (obj.speed.fly != undefined) {
        if (obj.speed.fly.number != undefined) {
          var fly =
            ", Fly " +
            obj.speed.fly.number +
            " feet " +
            obj.speed.fly.condition;
        } else if (obj.speed.fly > 0) {
          var fly = ", Fly " + obj.speed.fly + " feet";
        }
      } else {
        var fly = "";
      }
      if (obj.speed.swim > 0) {
        var swim = ", Swim " + obj.speed.swim + " feet";
      } else {
        var swim = "";
      }
      if (obj.speed.burrow > 0) {
        var burrow = ", Burrow " + obj.speed.burrow + " feet";
      } else {
        var burrow = "";
      }
      var rawspeed = walk + fly + swim + burrow;
      if (rawspeed.charAt(0) == ",") {
        var speed = rawspeed.slice(2);
      } else {
        var speed = rawspeed;
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    // CREATURE STATS
    if (obj.save == null) {
      var saves = undefined;
    } else {
      var saves = datacleanse(obj.save);
    }
    if (obj.skill == null) {
      var skills = undefined;
    } else {
      var skills = datacleanse(obj.skill);
    }
    if (obj.resist == null) {
      var resists = undefined;
    } else {
      var resists = datacleanse(obj.resist);
    }
    if (obj.immune == null) {
      var immunes = undefined;
    } else {
      var immunes = datacleanse(obj.immune);
    }
    if (obj.vulnerable == null) {
      var vulnerables = undefined;
    } else {
      var vulnerables = datacleanse(obj.vulnerable);
    }
    if (obj.conditionImmune == null) {
      var ConImmune = undefined;
    } else {
      var ConImmune = datacleanse(obj.conditionImmune);
    }
    if (obj.senses == null) {
      var senses = "";
    } else {
      var senses = datacleanse(obj.senses);
    }
    if (obj.passive == null) {
      var passive = "";
    } else {
      var passive = ", passive perception " + obj.passive;
    }
    var sensesOut = senses + passive;
    if (obj.languages == null) {
      var langOut = undefined;
    } else {
      var langOut = datacleanse(obj.languages);
    }
    // ---------------------------------------------------------------------------------------------------------
    // CREATURE TRAITS
    let traitsOut = [];
    var traitsList = obj.trait;
    if (traitsList == undefined) {
      var traitsLength = 0;
    } else {
      var traitsLength = traitsList.length;
    }
    for (var i = 0; i < traitsLength; i++) {
      if (traitsList[i].name != undefined) {
        traitsOut.push({
          name: traitsList[i].name,
          data: datacleanse(obj.trait[i].entries).replace(/\{.*\|0\|/g, ""),
        });
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    // CREATURE ACTIONS
    let actionsOut = [];
    var actionsList = obj.action;
    if (actionsList == undefined) {
      var actionsLength = 0;
    } else {
      var actionsLength = actionsList.length;
    }
    for (var i = 0; i < actionsLength; i++) {
      if (actionsList[i].name != undefined) {
        actionsOut.push({
          name: actionsList[i].name.replace(/\{@r/, "(R").replace(/\}/, ")"),
          data: datacleanse(obj.action[i].entries),
        });
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    // CREATURE REACTIONS
    let reactionsOut = [];
    var reactionsList = obj.reaction;
    if (obj.reaction != undefined) {
      if (reactionsList == undefined) {
        var reactionsLength = 0;
      } else {
        var reactionsLength = reactionsList.length;
      }
      for (var i = 0; i < reactionsLength; i++) {
        if (reactionsList[i].name != undefined) {
          reactionsOut.push({
            name: reactionsList[i].name
              .replace(/\{@r/, "(R")
              .replace(/\}/, ")"),
            data: datacleanse(obj.reaction[i].entries),
          });
        }
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    // CREATURE LEGENDARY ACTIONS
    let LegendaryActionsOut = [];
    var LegendaryActionsList = obj.legendary;
    if (obj.legendary != undefined) {
      if (LegendaryActionsList == undefined) {
        var LegendaryActionsLength = 0;
      } else {
        var LegendaryActionsLength = LegendaryActionsList.length;
      }
      for (var i = 0; i < LegendaryActionsLength; i++) {
        if (LegendaryActionsList[i].name != undefined) {
          LegendaryActionsOut.push({
            name: LegendaryActionsList[i].name
              .replace(/\{@r/, "(R")
              .replace(/\}/, ")"),
            data: datacleanse(obj.legendary[i].entries),
          });
        }
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    if (obj.spellcasting == undefined) {
      console.log("Not A Spellcaster");
    } else {
      var spellArray = obj.spellcasting;
      var I = spellArray.findIndex(
        (item) => item.hasOwnProperty("will") || item.hasOwnProperty("daily")
      );
      var S = spellArray.findIndex((item) => item.name === "Spellcasting");
      console.log("Innate: " + I);
      console.log("Spellcaster: " + S);
      if (I >= 0) {
        console.log("Innate Spellcaster");
        var Innate = "/Innate";
        var headerentryI = datacleanse(obj.spellcasting[I].headerEntries[0]);
        if (obj.spellcasting[I].will != undefined) {
          var will = datacleanse(obj.spellcasting[I].will);
        }
        if (obj.spellcasting[I].daily != undefined) {
          if (obj.spellcasting[I].daily["1e"] != undefined) {
            var daily1e = datacleanse(obj.spellcasting[I].daily["1e"]);
          }
          if (obj.spellcasting[I].daily["2e"] != undefined) {
            var daily2e = datacleanse(obj.spellcasting[I].daily["2e"]);
          }
          if (obj.spellcasting[I].daily["3e"] != undefined) {
            var daily3e = datacleanse(obj.spellcasting[I].daily["3e"]);
          }
        }
        if (obj.spellcasting[I].footerEntries != undefined) {
          var footerentryI = datacleanse(obj.spellcasting[I].footerEntries[0]);
        }
      } else {
        var Innate = "";
      }
      if (S >= 0) {
        console.log("Spellcaster");
        var Caster = "Spellcaster";
        var headerentryS = datacleanse(obj.spellcasting[S].headerEntries[0]);
        if (obj.spellcasting[S].spells[0].spells != undefined) {
          var cantrips = datacleanse(obj.spellcasting[S].spells[0].spells);
        }
        if (obj.spellcasting[S].spells[1] != undefined) {
          var lvl1slots = JSON.stringify(obj.spellcasting[S].spells[1].slots);
          var lvl1spells = datacleanse(obj.spellcasting[S].spells[1].spells);
        }
        if (obj.spellcasting[S].spells[2] != undefined) {
          var lvl2slots = JSON.stringify(obj.spellcasting[S].spells[2].slots);
          var lvl2spells = datacleanse(obj.spellcasting[S].spells[2].spells);
        }
        if (obj.spellcasting[S].spells[3] != undefined) {
          var lvl3slots = JSON.stringify(obj.spellcasting[S].spells[3].slots);
          var lvl3spells = datacleanse(obj.spellcasting[S].spells[3].spells);
        }
        if (obj.spellcasting[S].spells[4] != undefined) {
          var lvl4slots = JSON.stringify(obj.spellcasting[S].spells[4].slots);
          var lvl4spells = datacleanse(obj.spellcasting[S].spells[4].spells);
        }
        if (obj.spellcasting[S].spells[5] != undefined) {
          var lvl5slots = JSON.stringify(obj.spellcasting[S].spells[5].slots);
          var lvl5spells = datacleanse(obj.spellcasting[S].spells[5].spells);
        }
        if (obj.spellcasting[S].footerEntries != undefined) {
          var footerentryS = datacleanse(obj.spellcasting[S].footerEntries[0]);
        }
      } else {
        var Caster = "";
      }
      var rawCasterInnate = Caster + Innate;
      if (rawCasterInnate.charAt(0) == "/") {
        var CasterInnate = rawCasterInnate.slice(1);
      } else {
        var CasterInnate = rawCasterInnate;
      }
    }
    // ---------------------------------------------------------------------------------------------------------
    object["name"] = obj["name"];
    object["size"] = checksize(obj.size);
    object["source"] = obj["source"];
    object["page"] = obj["page"];
    object["type"] = type;
    object["tags"] = tags;
    object["alignment"] = alignTypeOut + " " + alignClassOut;
    if (obj.ac != undefined) {
      if (obj.ac[0].ac != undefined) {
        object["ac"] = obj.ac[0].ac;
      } else {
        object["ac"] = obj.ac[0];
      }
    } else {
      object["ac"] = undefined;
    }
    if (obj.hp != undefined) {
      object["hp"] = obj.hp.average;
    } else {
      object["hp"] = "N/A";
    }
    object["speed"] = speed;
    object["STR"] = obj["str"];
    object["DEX"] = obj["dex"];
    object["CON"] = obj["con"];
    object["INT"] = obj["int"];
    object["WIS"] = obj["wis"];
    object["CHA"] = obj["cha"];
    object["saves"] = saves;
    object["skills"] = skills;
    object["resist"] = resists;
    object["immune"] = immunes;
    object["vulnerable"] = vulnerables;
    object["conditionImmune"] = ConImmune;
    if (sensesOut.charAt(0) == ",") {
      object["senses"] = sensesOut.slice(2);
    } else {
      object["senses"] = sensesOut;
    }
    object["languages"] = langOut;
    if (traitsOut != undefined) {
      var traitsOutLength = traitsOut.length;
      for (var i = 0; i < traitsOutLength; i++) {
        object["T" + [i] + "H"] = traitsOut[i].name;
        object["T" + [i] + "D"] = traitsOut[i].data;
      }
    } else {
      console.warn("ERROR");
      object[T0H] = undefined;
      object[T0D] = undefined;
    }
    if (actionsOut != undefined) {
      var actionsOutLength = actionsOut.length;
      for (var i = 0; i < actionsOutLength; i++) {
        object["A" + [i] + "H"] = actionsOut[i].name;
        object["A" + [i] + "D"] = actionsOut[i].data;
      }
    } else {
      console.warn("ERROR");
      object[A0H] = undefined;
      object[A0D] = undefined;
    }
    if (reactionsOut != undefined) {
      var reactionsOutLength = reactionsOut.length;
      for (var i = 0; i < reactionsOutLength; i++) {
        object["RA" + [i] + "H"] = reactionsOut[i].name;
        object["RA" + [i] + "D"] = reactionsOut[i].data;
      }
    } else {
      console.warn("ERROR");
      object[RA0H] = undefined;
      object[RA0D] = undefined;
    }
    if (LegendaryActionsOut != undefined) {
      var LegendaryActionsOutLength = LegendaryActionsOut.length;
      for (var i = 0; i < LegendaryActionsOutLength; i++) {
        object["LA" + [i] + "H"] = LegendaryActionsOut[i].name;
        object["LA" + [i] + "D"] = LegendaryActionsOut[i].data;
      }
    } else {
      console.warn("ERROR");
      object[LA0H] = undefined;
      object[LA0D] = undefined;
    }
    object["CasterInnate"] = CasterInnate;
    object["innateHeaderEntry"] = headerentryI;
    object["spellHeaderEntry"] = headerentryS;
    object["cantrip"] = cantrips;
    object["lvl1slots"] = lvl1slots;
    object["lvl1spells"] = lvl1spells;
    object["lvl2slots"] = lvl2slots;
    object["lvl2spells"] = lvl2spells;
    object["lvl3slots"] = lvl3slots;
    object["lvl3spells"] = lvl3spells;
    object["lvl4slots"] = lvl4slots;
    object["lvl4spells"] = lvl4spells;
    object["lvl5slots"] = lvl5slots;
    object["lvl5spells"] = lvl5spells;
    object["atWill"] = will;
    object["daily1e"] = daily1e;
    object["daily2e"] = daily2e;
    object["daily3e"] = daily3e;
    object["innateFooterEntry"] = footerentryI;
    object["spellFooterEntry"] = footerentryS;
    console.log(object);
    // ---------------------------------------------------------------------------------------------------------
    // Extract File
    // ---------------------------------------------------------------------------------------------------------
    let outputJson = JSON.stringify(object);
    document.getElementById("creatureform").reset();
    const objct = JSON.parse(outputJson);
    for (const prop in objct) {
      console.log(`${objct[prop]}`);
      document.getElementById(`${prop}`).value = `${objct[prop]}`;
    }
    console.warn("Cleric: Summoning Ritual Complete");
  }
}

// ---------------------------------------------------------------------------------------------------------
function showInput() {
  //---------------
  //Output Clearer
  document
    .getElementsByName("clearme")
    .forEach((Element) => (Element.innerHTML = ""));
  document.getElementById("innatebreak").classList.remove("margin");
  document.getElementById("spellbreak").classList.remove("margin");
  document.getElementById("alignment-out").classList = [];
  document.getElementById("alignment-out").classList.add("alignment");
  document.getElementById("TRAITS").classList.add("hidden");
  document.getElementById("ACTIONS").classList.add("hidden");
  document.getElementById("LEGENDARY").classList.add("hidden");
  document.getElementById("REACTIONS").classList.add("hidden");
  document
    .getElementById("alignment-out")
    .classList.add(
      document.getElementById("alignment").value.replace(/\s/g, "")
    );
  if (document.getElementById("T0D").value != "") {
    document.getElementById("TRAITS").classList.remove("hidden");
  }
  if (document.getElementById("casterInnate").value != null) {
    document.getElementById("TRAITS").classList.remove("hidden");
  }
  if (document.getElementById("A0D").value != "") {
    document.getElementById("ACTIONS").classList.remove("hidden");
  }
  if (document.getElementById("LA0D").value != "") {
    document.getElementById("LEGENDARY").classList.remove("hidden");
  }
  if (document.getElementById("RA0D").value != "") {
    document.getElementById("REACTIONS").classList.remove("hidden");
  }

  document
    .getElementById("CreatureToken")
    .setAttribute(
      "src",
      "http://localhost:8080/EnchantedForge/ImageAssets/CreatureImages/" +
        document.getElementById("name").value +
        ".png"
    );

  //---------------
  //Function Start
  var form = new FormData(document.getElementById("creatureform"));
  const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
  const skills = [
    "saves",
    "skills",
    "resist",
    "immune",
    "vulnerable",
    "conditionImmune",
    "senses",
    "languages",
  ];
  const ignore = [
    "source",
    "page",
    "spellHeaderEntry",
    "spellFooterEntry",
    "cantrip",
    "lvl1slots",
    "lvl2slots",
    "lvl3slots",
    "lvl4slots",
    "lvl5slots",
    "lvl1spells",
    "lvl2spells",
    "lvl3spells",
    "lvl4spells",
    "lvl5spells",
    "innateHeaderEntry",
    "innateFooterEntry",
    "atWill",
    "daily1e",
    "daily2e",
    "daily3e",
    "customIndicator",
  ];
  skills.forEach(function (skill) {
    if (document.getElementById(skill).value != "") {
      document.getElementById(skill + "H-out").innerHTML = checkheader(skill);
    }
  });
  for (var [key, value] of form) {
    if (ignore.indexOf(key) >= 0) {
      //do nothing
    } else if (key == "tags") {
      if (value != "") {
        document.getElementById(key + "-out").innerHTML =
          "(" + document.getElementById(key).value + ")";
      } else {
        document.getElementById(key + "-out").innerHTML = "";
      }
    } else if (stats.indexOf(key) >= 0) {
      document.getElementById(key + "-out").innerHTML = checkstatrole(
        document.getElementById(key).value
      );
    } else if (key == "CasterInnate") {
      if (document.getElementById(key).value == "Spellcaster/Innate") {
        SpellCasterHeaders();
        InnateSpellsHeaders();
      } else if (document.getElementById(key).value == "Spellcaster") {
        SpellCasterHeaders();
      } else if (document.getElementById(key).value == "Innate") {
        InnateSpellsHeaders();
      } else {
        //do nothing
      }
    } else {
      document.getElementById(key + "-out").innerHTML = [value];
    }
  }
  var source = document.getElementById("source").value.toUpperCase();
  document.getElementById("source-out").innerHTML =
    document.getElementById("source").value;
  if (source != "HOMEBREW") {
    document.getElementById("page-out").innerHTML =
      "p" + document.getElementById("page").value;
  } else {
    document.getElementById("page-out").innerHTML = "";
  }
  document.getElementById("source-out").removeAttribute("class");
  document.getElementById("source-out").classList.add("source");
  if (source == "HOMEBREW") {
    document.getElementById("source-out").classList.add("HMBW");
    document.getElementById("source-out").innerHTML = "Hmbrw";
  } else {
    document
      .getElementById("source-out")
      .classList.add(document.getElementById("source").value);
  }

  // Get the elements
  const creatureContainer = document.getElementById("photo");
  const creatureToken = document.getElementById("CreatureToken");

  // Calculate the desired max-height
  const maxHeight = creatureContainer.offsetHeight - 150;

  // Set the max-height of the image
  creatureToken.style.maxHeight = `${maxHeight}px`;

  console.log("resize");
}
function SpellCasterHeaders() {
  const slots = [
    "spellHeaderEntry",
    "cantrip",
    "lvl1slots",
    "lvl2slots",
    "lvl3slots",
    "lvl4slots",
    "lvl5slots",
  ];
  document.getElementById("spellbreak").classList.add("margin");
  slots.forEach(function (header) {
    if (document.getElementById(header).value != 0) {
      if (header == "spellHeaderEntry" || header == "cantrip") {
        document.getElementById(header + "H-out").innerHTML =
          checkheader(header);
      } else {
        document.getElementById(header + "H-out").innerHTML =
          checkheader(header) +
          document.getElementById(header).value +
          " slots): ";
      }
      const fields = [
        "spellHeaderEntry",
        "cantrip",
        "lvl1spells",
        "lvl2spells",
        "lvl3spells",
        "lvl4spells",
        "lvl5spells",
        "spellFooterEntry",
      ];
      fields.forEach(function (fieldname) {
        if (document.getElementById(fieldname).value != "") {
          document.getElementById(fieldname + "-out").innerHTML =
            document.getElementById(fieldname).value;
        }
      });
      if (document.getElementById("spellFooterEntry").value != null) {
        document.getElementById("spellFooterEntry-out").innerHTML =
          document.getElementById("spellFooterEntry").value;
      }
    }
  });
}
function InnateSpellsHeaders() {
  const fields = [
    "innateHeaderEntry",
    "atWill",
    "daily1e",
    "daily2e",
    "daily3e",
  ];
  document.getElementById("innatebreak").classList.add("margin");
  fields.forEach(function (header) {
    if (document.getElementById(header).value != "") {
      document.getElementById(header + "H-out").innerHTML = checkheader(header);
      document.getElementById(header + "-out").innerHTML =
        document.getElementById(header).value;
    }
  });
  if (document.getElementById("innateFooterEntry").value != "") {
    document.getElementById("innateFooterEntry-out").innerHTML =
      document.getElementById("innateFooterEntry").value;
  }
}

// ---------------------------------------------------------------------------------------------------------
//EXPORT SOURCE CODE
function exportSource() {
  var form = new FormData(document.getElementById("creatureform")); //loads the document into a form object based on it being the parent of the button (button is the div here because i'm lazy)
  let outputObject = {};
  for (var [key, value] of form) {
    //loop the form data
    if (value == 0) {
      //Do nothing
    } else if (value != "") {
      //if the key exists
      outputObject[key] = value; //store it in the object
    }
  }
  let outputJson = JSON.stringify(outputObject); //turn the object into json
  var hiddenElement = document.createElement("a");
  var filename = document.getElementById("name").value;
  hiddenElement.href = "data:attachment/text," + encodeURI(outputJson);
  hiddenElement.target = "_blank";
  hiddenElement.download = filename + ".json";
  hiddenElement.click();
}
