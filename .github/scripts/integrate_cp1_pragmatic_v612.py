from pathlib import Path
import json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v612';" in s:
    raise SystemExit('V612 already integrated')
if "var VERSION = 'v611';" not in s:
    raise SystemExit('Expected V611 source')

# Version / guard
s = s.replace('École primaire interactive V611', 'École primaire interactive V612', 1)
s = s.replace('if (window.__nxPrimaryExercisesV611) return;', 'if (window.__nxPrimaryExercisesV612) return;', 1)
s = s.replace('window.__nxPrimaryExercisesV611 = true;', 'window.__nxPrimaryExercisesV612 = true;', 1)
s = s.replace("var VERSION = 'v611';", "var VERSION = 'v612';", 1)

# Voice: slower and calmer for CP1
old_voice = "u.lang = 'fr-FR'; u.rate = .88; speechSynthesis.speak(u);"
new_voice = "u.lang = 'fr-FR'; u.rate = .72; u.pitch = .96; u.volume = 1; speechSynthesis.speak(u);"
if old_voice not in s:
    raise SystemExit('Voice marker not found')
s = s.replace(old_voice, new_voice, 1)

# Pragmatic rule cards. Existing lesson data is preserved.
marker = "  function progressWrite(level, subject, good, total) {"
if marker not in s:
    raise SystemExit('progressWrite marker not found')
rule_js = r'''  function cp1RuleText(lesson, subject) {
    var title = lesson && lesson.title ? lesson.title : '';
    var rules = {
      'Saluer et se présenter': 'Pour saluer : « Bonjour ». Pour donner ton nom : « Je m’appelle… ».',
      'Comprendre une consigne simple': 'J’écoute toute la consigne. Je cherche ce qu’on me demande. Ensuite seulement, j’agis.',
      'Reconnaître et lire un prénom': 'Un prénom commence par une majuscule. Je regarde tout le prénom, pas seulement sa première lettre.',
      'Un, une, le et la': 'On apprend le nom avec son petit mot : un ou le ; une ou la.',
      'Un seul ou plusieurs': 'Un seul = singulier. Plusieurs = pluriel. Souvent, le nom prend un s au pluriel.',
      'Masculin et féminin : premiers repères': 'J’apprends le nom avec son article : un/le ou une/la. Je ne devine pas seulement en regardant l’objet.',
      'Mettre les mots dans le bon ordre': 'Pour une phrase simple : QUI ? + FAIT QUOI ? Exemple : « Awa lit. »',
      'La majuscule et le point': 'Une phrase commence par une majuscule et se termine par un point.',
      'Poser une question simple': 'Une question demande une information et se termine par un point d’interrogation : ?.',
      'Écrire une phrase simple': 'Majuscule au début. Mots dans le bon ordre. Point à la fin. Puis je relis.',
      'Plus, moins et autant': 'Plus = quantité plus grande. Moins = quantité plus petite. Autant = même quantité.',
      'Trier et classer': 'Je choisis un seul critère de tri, puis je classe tous les objets avec ce même critère.',
      'Sur, sous, en haut et en bas': 'Je donne toujours la position par rapport à un repère : sur quoi ? sous quoi ? en haut de quoi ?',
      'Devant, derrière, entre, à côté, dedans et dehors': 'Pour situer un objet, je choisis un repère puis j’utilise le mot de position exact.',
      'Additionner jusqu’à 5': 'Additionner, c’est réunir ou ajouter. Le signe + signifie « plus ».',
      'Comparer et ranger les nombres de 0 à 9': 'Sur la bande numérique, un nombre placé plus à droite est plus grand.',
      'Long, court et comparaison des longueurs': 'Pour comparer deux longueurs, j’aligne les objets au même point de départ.',
      'Le nombre 10 et la dizaine': '10 unités = 1 dizaine.',
      'Les nombres 11 et 12': '11 = 1 dizaine + 1 unité. 12 = 1 dizaine + 2 unités.',
      'Les nombres de 13 à 15': '13, 14 et 15 ont chacun 1 dizaine. Les unités sont 3, 4 et 5.',
      'Le nombre 16': '16 = 1 dizaine + 6 unités.',
      'Construire des additions jusqu’à 20': 'Pour additionner, je peux d’abord compléter 10, puis ajouter ce qui reste.',
      'Comprendre la soustraction': 'Soustraire, c’est enlever ou chercher ce qui reste. Le signe − signifie « moins ».',
      'Avancer ou reculer de 2 et de 3': 'Ajouter = avancer sur la bande numérique. Soustraire = reculer.',
      'Les nombres de 17 à 19': '17, 18 et 19 ont chacun 1 dizaine. Les unités sont 7, 8 et 9.',
      'Le nombre 20 : deux dizaines': '20 unités = 2 dizaines.',
      'Partager une petite collection': 'Partager équitablement = donner la même quantité à chacun.',
      'Le double': 'Le double d’un nombre = ce nombre + le même nombre. Exemple : double de 3 = 3 + 3 = 6.',
      'La moitié': 'La moitié = partager en 2 parts égales.',
      'Les nombres ordinaux : premier, deuxième…': 'Premier, deuxième, troisième… indiquent une position, pas une quantité.',
      'Gauche, droite, quadrillage et tableau': 'Je suis les déplacements un par un et je respecte le sens gauche/droite du point de vue indiqué.',
      'Lignes, carré, rectangle et symétrie': 'Carré : 4 côtés égaux. Rectangle : 4 côtés, avec les côtés opposés de même longueur.',
      'Résoudre un petit problème': 'Je lis. Je cherche ce que je connais. Je cherche ce qu’on demande. Je choisis l’opération. Je vérifie.',
      'Les règles de la classe': 'J’écoute. J’attends mon tour. Je respecte les personnes et le matériel. Je suis les règles de sécurité.',
      'Bien se comporter sur la route': 'Je m’arrête. Je regarde des deux côtés. J’écoute. Je traverse seulement quand c’est sûr avec l’adulte.',
      'Écouter un signal et s’arrêter': 'Au signal « stop », je m’arrête immédiatement et j’écoute la prochaine consigne.',
      'Jouer avec fair-play': 'Je respecte les règles, les autres joueurs et le résultat. Je ne frappe pas et je n’insulte pas.'
    };
    if (rules[title]) return rules[title];
    if (/^Le son /.test(title)) return 'Règle de lecture : je regarde le signe, je prononce le son, puis je cherche ce son dans le mot.';
    if (/^Lire /.test(title)) return 'Règle de lecture : je garde les lettres dans l’ordre, je lis les syllabes, puis je réunis le mot.';
    if (/^Le nombre [0-9]+/.test(title)) return 'Règle de comptage : je compte chaque objet une seule fois. Le dernier nombre dit donne la quantité.';
    return '';
  }

'''
s = s.replace(marker, rule_js + marker, 1)

# Explanation becomes more practical and reads the rule aloud.
old = "    var title = second ? 'Je comprends autrement' : 'Je découvre';\n    var body = second ? lesson.two : lesson.one; var extra = lesson.example || '';\n    state.readText = title + '. ' + lesson.title + '. ' + body + (extra ? ' ' + extra : '');"
new = "    var title = second ? 'Comment faire ?' : 'Je découvre';\n    var body = second ? lesson.two : lesson.one; var extra = lesson.example || '';\n    var rule = cp1RuleText(lesson, state.subject);\n    state.readText = title + '. ' + lesson.title + '. ' + body + (rule ? ' Règle à retenir. ' + rule : '') + (extra ? ' Exemple. ' + extra : '');"
if old not in s:
    raise SystemExit('Explanation block marker not found')
s = s.replace(old, new, 1)

# Insert explicit rule/method cards before the example.
old_html = "      '<div class=\"nx-kid-step look\"><span class=\"ico\">👀</span><div><b>2. Je regarde</b><small style=\"display:block;color:#6b7380\">Regarde la grande image.</small></div></div><p class=\"nx-kid-easy\">' + esc(body) + '</p>' +\n      (extra ? '<div class=\"nx-kid-example\"><b>💡 Exemple</b><br>' + esc(extra) + '</div>' : '') + '<div class=\"nx-kid-step try\"><span class=\"ico\">☝🏾</span><div><b>3. J’essaie</b><small style=\"display:block;color:#6b7380\">Une grande réponse suffit.</small></div></div></section>' +"
new_html = "      '<div class=\"nx-kid-step look\"><span class=\"ico\">👀</span><div><b>2. Je regarde</b><small style=\"display:block;color:#6b7380\">Regarde la grande image.</small></div></div>' + (second ? '<div class=\"nx-kid-method-title\">🛠️ COMMENT FAIRE ?</div>' : '') + '<p class=\"nx-kid-easy\">' + esc(body) + '</p>' +\n      (rule ? '<div class=\"nx-kid-rule\"><b>📌 RÈGLE À RETENIR</b><span>' + esc(rule) + '</span></div>' : '') +\n      (extra ? '<div class=\"nx-kid-example\"><b>💡 EXEMPLE CONCRET</b><br>' + esc(extra) + '</div>' : '') + '<div class=\"nx-kid-step try\"><span class=\"ico\">☝🏾</span><div><b>3. J’essaie</b><small style=\"display:block;color:#6b7380\">Une grande réponse suffit.</small></div></div></section>' +"
if old_html not in s:
    raise SystemExit('Explanation HTML marker not found')
s = s.replace(old_html, new_html, 1)

# Mobile-safe visual sizing and explicit pedagogical cards.
css_marker = "      @media(max-width:520px){.nx-kid-welcome h2{font-size:27px}"
if css_marker not in s:
    raise SystemExit('Premium CSS marker not found')
css = r'''      .nx-kid-rule{margin:13px 0;background:#fff7c7;border:3px solid #ffd539;border-radius:20px;padding:14px 15px;color:#473400;box-shadow:0 4px 10px rgba(141,104,0,.08)}.nx-kid-rule b{display:block;font-size:16px;letter-spacing:.3px;margin-bottom:6px;color:#7c5600}.nx-kid-rule span{display:block;font-size:19px;line-height:1.48;font-weight:850}.nx-kid-method-title{margin:12px 0 6px;background:#e7f5ff;color:#075cae;border-radius:16px;padding:10px 12px;font-size:16px;font-weight:950;letter-spacing:.3px}
      .nx-kid-subject-art,.nx-kid-scene,.nx-kid-question,.nx-kid-card,.nx-kid-lesson,.nx-kid-subject-hero{max-width:100%;box-sizing:border-box;overflow:hidden}.nx-kid-subject-art svg{display:block;width:100%;max-width:100%;height:100%;object-fit:contain}.nx-kid-lesson>div,.nx-kid-subject-info,.nx-kid-subject-hero>div{min-width:0;max-width:100%}.nx-kid-scene-visual{max-width:calc(100% - 16px);box-sizing:border-box;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:clamp(28px,11vw,56px);letter-spacing:clamp(0px,1vw,4px);padding:0 6px}.nx-kid-scene.compact .nx-kid-scene-visual{font-size:clamp(25px,8vw,34px)}
'''
s = s.replace(css_marker, css + css_marker, 1)

# Extra protection on very small phones.
small_marker = "      @media(max-width:370px){.nx-kid-subject-grid{grid-template-columns:1fr}"
if small_marker not in s:
    raise SystemExit('Small mobile marker not found')
small_css = "      @media(max-width:390px){.nx-kid-scene{height:185px}.nx-kid-scene-visual{font-size:clamp(25px,10vw,40px);letter-spacing:0}.nx-kid-question h2{font-size:21px}.nx-kid-rule span{font-size:17px}.nx-kid-subject-hero{grid-template-columns:96px 1fr}.nx-kid-subject-hero h2{font-size:20px}}\n"
s = s.replace(small_marker, small_css + small_marker, 1)

path.write_text(s, encoding='utf-8')

version = Path('version.json')
data = json.loads(version.read_text(encoding='utf-8'))
data['version'] = 'V612'
data['message'] = 'Nexora V612 : voix CP1 ralentie, illustrations mobiles contenues, regles affichees clairement, methode pratique et exemples concrets.'
data['critical'] = False
version.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Integrated V612 pragmatic CP1 pedagogy')
