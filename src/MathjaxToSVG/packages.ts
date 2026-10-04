/**
 * MathJax 3's `AllPackages` module registers the TeX configurations below,
 * but it also reaches into a global `MathJax.loader` and calls `preLoad()`.
 *
 * Obsidian (or another plugin) may already have initialized MathJax 4, where
 * that loader API was renamed to `preLoaded()`. Importing MathJax 3's
 * `AllPackages` in that environment throws during module evaluation and can
 * prevent Excalidraw Extras from starting at all.
 *
 * Register the same MathJax 3 TeX configurations directly instead. The
 * renderer in Excalidraw Extras is self-contained and does not need to mutate
 * or coordinate with Obsidian's global MathJax component loader.
 */
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/action/ActionConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/amscd/AmsCdConfiguration.js';
import 'mathjax-full/js/input/tex/bbox/BboxConfiguration.js';
import 'mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import 'mathjax-full/js/input/tex/braket/BraketConfiguration.js';
import 'mathjax-full/js/input/tex/bussproofs/BussproofsConfiguration.js';
import 'mathjax-full/js/input/tex/cancel/CancelConfiguration.js';
import 'mathjax-full/js/input/tex/cases/CasesConfiguration.js';
import 'mathjax-full/js/input/tex/centernot/CenternotConfiguration.js';
import 'mathjax-full/js/input/tex/color/ColorConfiguration.js';
import 'mathjax-full/js/input/tex/colorv2/ColorV2Configuration.js';
import 'mathjax-full/js/input/tex/colortbl/ColortblConfiguration.js';
import 'mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
import 'mathjax-full/js/input/tex/empheq/EmpheqConfiguration.js';
import 'mathjax-full/js/input/tex/enclose/EncloseConfiguration.js';
import 'mathjax-full/js/input/tex/extpfeil/ExtpfeilConfiguration.js';
import 'mathjax-full/js/input/tex/gensymb/GensymbConfiguration.js';
import 'mathjax-full/js/input/tex/html/HtmlConfiguration.js';
import 'mathjax-full/js/input/tex/mathtools/MathtoolsConfiguration.js';
import 'mathjax-full/js/input/tex/mhchem/MhchemConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax-full/js/input/tex/noerrors/NoErrorsConfiguration.js';
import 'mathjax-full/js/input/tex/noundefined/NoUndefinedConfiguration.js';
import 'mathjax-full/js/input/tex/physics/PhysicsConfiguration.js';
import 'mathjax-full/js/input/tex/setoptions/SetOptionsConfiguration.js';
import 'mathjax-full/js/input/tex/tagformat/TagFormatConfiguration.js';
import 'mathjax-full/js/input/tex/textcomp/TextcompConfiguration.js';
import 'mathjax-full/js/input/tex/textmacros/TextMacrosConfiguration.js';
import 'mathjax-full/js/input/tex/upgreek/UpgreekConfiguration.js';
import 'mathjax-full/js/input/tex/unicode/UnicodeConfiguration.js';
import 'mathjax-full/js/input/tex/verb/VerbConfiguration.js';

// Keep this list in sync with mathjax-full 3.2.2's exported AllPackages list.
export const ALL_PACKAGES: string[] = [
  'base',
  'action',
  'ams',
  'amscd',
  'bbox',
  'boldsymbol',
  'braket',
  'bussproofs',
  'cancel',
  'centernot',
  'color',
  'colortbl',
  'empheq',
  'enclose',
  'extpfeil',
  'gensymb',
  'html',
  'mathtools',
  'mhchem',
  'newcommand',
  'noerrors',
  'noundefined',
  'upgreek',
  'unicode',
  'verb',
  'configmacros',
  'tagformat',
  'textcomp',
  'textmacros',
];
