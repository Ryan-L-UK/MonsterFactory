// ---------------------------------------------------------------------------------------------------------
//PAGE LOAD FUNCTION
window.addEventListener("DOMContentLoaded", loadSources);

async function loadSources() {
  // 1. Load merged creatures from the server
  const creatures = await fetch("/api/creatures").then((res) => res.json());

  // 2. Load your other sources in parallel
  const [attributes, perks] = await Promise.all([
    fetch("/Bestiary/attributes.json").then((res) => res.json()),
    fetch("/Bestiary/perks.json").then((res) => res.json()),
  ]);

  // 3. Store everything
  Sources.attributes = attributes;
  Sources.creatures = creatures;
  Sources.perks = perks;

  console.log("All sources loaded:", Sources);

  // 4. Generate your first monster
  generateMonster();
}
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
let Sources = {
  attributes: [],
  creatures: [],
  perks: [],
};
function getRandomPerk(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomCreature(creatures) {
  return creatures[Math.floor(Math.random() * creatures.length)];
}

// Generate monster on button press
function generateMonster() {
  const attribute = getRandomPerk(Sources.attributes);
  const creature = getRandomCreature(Sources.creatures);
  const perk = getRandomPerk(Sources.perks);

  console.log("Picked:", {
    attribute: attribute,
    creature: creature,
    perk: perk,
  });
  //Fill In Statblock
  document
    .getElementById("CreatureImage")
    .setAttribute(
      "src",
      "http://localhost:6969/Vault/Creatures/" + creature.name + ".webp"
    );

  document
    .getElementById("attribute-icon-out")
    .setAttribute(
      "src",
      "http://localhost:6969/Vault/Icons/Attribute/" + attribute.name + ".png"
    );
  document.getElementById("attribute-out").innerHTML = attribute.name;

  if (creature.type.type != undefined) {
    document.getElementById("type-out").innerHTML = creature.type.type;
    document
      .getElementById("type-icon-out")
      .setAttribute(
        "src",
        "http://localhost:6969/Vault/Icons/Type/" + creature.type.type + ".png"
      );
  } else {
    document.getElementById("type-out").innerHTML = creature.type;
    document
      .getElementById("type-icon-out")
      .setAttribute(
        "src",
        "http://localhost:6969/Vault/Icons/Type/" + creature.type + ".png"
      );
  }
  if (creature.type.tags != undefined) {
    document.getElementById("tags-out").innerHTML =
      " (" + creature.type.tags + ")";
  } else {
    document.getElementById("tags-out").innerHTML = "";
  }

  document
    .getElementById("perk-icon-out")
    .setAttribute(
      "src",
      "http://localhost:6969/Vault/Icons/Perk/" + perk.name + ".png"
    );
  document.getElementById("perk-out").innerHTML = perk.name;

  document.getElementById("name-out").innerHTML =
    attribute.prefix + " " + creature.name + " " + perk.descriptor;

  document.getElementById("desc-out").innerHTML =
    "This " +
    creature.name +
    " was " +
    attribute.origin +
    ". It is " +
    perk.effect +
    ".";

  if (creature.alignment == undefined) {
    var alignTypeOut = "Unaligned";
    var alignClassOut = "";
  } else if (creature.alignment[0] == "NX") {
    var alignTypeOut = "Any Non-Lawful Alignment";
    var alignClassOut = "";
  } else {
    if (creature.alignment[0] != undefined) {
      var alignTypeOut = checkalignment(creature.alignment[0]);
    } else {
      var alignTypeOut = "";
    }
    if (creature.alignment[1] != undefined) {
      var alignClassOut = checkalignment(creature.alignment[1]);
    } else {
      var alignClassOut = "";
    }
  }
  document.getElementById("alignment-out").innerHTML =
    alignTypeOut + " " + alignClassOut;
  document
    .getElementById("alignment-out")
    .classList.add((alignTypeOut + alignClassOut).replace(/\s/g, ""));
  document.getElementById("size-out").innerHTML = checksize(creature.size);

  if (creature.speed == undefined) {
    var walk = undefined;
  } else {
    if (creature.speed.walk >= 0) {
      var walk = "Walk " + creature.speed.walk + " feet";
    } else {
      var walk = "";
    }
    if (creature.speed.fly != undefined) {
      if (creature.speed.fly.number != undefined) {
        var fly =
          ", Fly " +
          creature.speed.fly.number +
          " feet " +
          creature.speed.fly.condition;
      } else if (creature.speed.fly > 0) {
        var fly = ", Fly " + creature.speed.fly + " feet";
      }
    } else {
      var fly = "";
    }
    if (creature.speed.swim > 0) {
      var swim = ", Swim " + creature.speed.swim + " feet";
    } else {
      var swim = "";
    }
    if (creature.speed.burrow > 0) {
      var burrow = ", Burrow " + creature.speed.burrow + " feet";
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

  document.getElementById("speed-out").innerHTML = speed;

  if (creature.skill != undefined) {
    document.getElementById("skillsH-out").innerHTML = "Skills:";
    document.getElementById("skills-out").innerHTML = Object.entries(
      creature.skill
    )
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  if (creature.save != undefined) {
    document.getElementById("savesH-out").innerHTML = "Saves:";
    document.getElementById("saves-out").innerHTML = Object.entries(
      creature.save
    )
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  if (creature.senses == null) {
    var senses = "";
  } else {
    var senses = datacleanse(creature.senses);
  }
  if (creature.passive == null) {
    var passive = "";
  } else {
    var passive = ", passive perception " + creature.passive;
  }
  var sensesOut = senses + passive;

  if (creature.senses != undefined) {
    document.getElementById("sensesH-out").innerHTML = "Senses:";
    document.getElementById("senses-out").innerHTML = sensesOut;
  }

  if (creature.languages != undefined) {
    document.getElementById("languagesH-out").innerHTML = "Languages:";
    document.getElementById("languages-out").innerHTML = datacleanse(
      creature.languages
    );
  }

  document.getElementById("STR-out").innerHTML = checkstatrole(creature.str);
  document.getElementById("DEX-out").innerHTML = checkstatrole(creature.dex);
  document.getElementById("CON-out").innerHTML = checkstatrole(creature.con);
  document.getElementById("INT-out").innerHTML = checkstatrole(creature.int);
  document.getElementById("WIS-out").innerHTML = checkstatrole(creature.wis);
  document.getElementById("CHA-out").innerHTML = checkstatrole(creature.cha);

  if (creature.hp != undefined) {
    document.getElementById("hp-out").innerHTML = creature.hp.average;
  } else {
    document.getElementById("hp-out").innerHTML = "N/A";
  }

  if (creature.ac != undefined) {
    if (creature.ac[0].ac != undefined) {
      document.getElementById("ac-out").innerHTML = creature.ac[0].ac;
    } else {
      document.getElementById("ac-out").innerHTML = creature.ac[0];
    }
  } else {
    document.getElementById("ac-out").innerHTML = undefined;
  }

  if (creature.resist == null) {
    document.getElementById("resist-out").innerHTML = undefined;
  } else {
    document.getElementById("resist-out").innerHTML = datacleanse(
      creature.resist
    );
  }

  if (creature.immune == null) {
    document.getElementById("immune-out").innerHTML = undefined;
  } else {
    document.getElementById("immune-out").innerHTML = datacleanse(
      creature.immune
    );
  }

  if (creature.vulnerable == null) {
    document.getElementById("vulnerable-out").innerHTML = undefined;
  } else {
    document.getElementById("vulnerable-out").innerHTML = datacleanse(
      creature.vulnerable
    );
  }

  if (creature.conditionImmune == null) {
    document.getElementById("conditionImmune-out").innerHTML = undefined;
  } else {
    document.getElementById("conditionImmune-out").innerHTML = datacleanse(
      creature.conditionImmune
    );
  }

  //Other Things
  if (!attribute || !creature || !perk) {
    alert("Sources not loaded yet!");
    return;
  }
}
