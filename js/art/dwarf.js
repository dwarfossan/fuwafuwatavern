/* 大爺立繪（胸口以上）
   10-02 換成大爺給的參考 SVG：白髮假鬍子女黑暗精靈——推眼鏡的手、紅眼、小圓眼鏡、鋸齒牙、
   頭髮從臉側編成八字鬍和胸前大辮子、紫背心、皮圍裙。只拿掉米色底、改 id 免得跟別的 SVG 撞名
   商店小頭像用 DWARF_FACE_VIEWBOX 只取臉 */
const DWARF_FACE_VIEWBOX = "120 70 370 370";
const DWARF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
<defs>
<g id="dwarf-plait"><path d="M-35 0Q-5-8 28 28Q10 54-25 48Q-48 26-35 0Z" fill="#fff5e7"/><path d="M35 0Q5-8-28 28Q-10 54 25 48Q48 26 35 0Z" fill="#e9d9ce"/><path d="M-27 6Q-4 13 16 33M27 6Q4 13-16 33" fill="none" stroke="#bca399" stroke-width="3"/></g>
</defs>
<g stroke="#49332e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
<!-- outer hair -->
<path d="M142 240Q85 127 174 66Q238 7 303 30Q385 9 453 90Q511 171 467 274L523 529Q452 600 300 589Q137 595 76 522Z" fill="#fff5e7"/>
<path d="M131 326Q117 451 89 509M457 325Q471 446 500 516" fill="none" stroke="#cbb4a7"/>
<!-- shoulders and clothing -->
<path d="M205 430Q137 436 95 483L60 658Q302 691 542 658L510 484Q467 441 396 430Z" fill="#f1deca"/>
<path d="M188 439L230 419H370L408 440L455 653H144Z" fill="#65506e"/>
<path d="M229 420L300 461L371 420L351 561H252Z" fill="#d6b7a1"/>
<path d="M176 490L424 490L450 678H149Z" fill="#966047"/>
<path d="M180 503L424 524M177 543L429 563" fill="none" stroke="#b77c54"/>
<path d="M195 440L183 541M406 441L420 542" fill="none" stroke="#503a30" stroke-width="17"/>
<circle cx="183" cy="539" r="13" fill="#d9ab57"/><circle cx="420" cy="539" r="13" fill="#d9ab57"/>
<!-- pointed ears -->
<path d="M151 219L38 209Q68 251 154 284Z" fill="#b58d7b"/>
<path d="M449 219L564 182Q538 237 447 280Z" fill="#b58d7b"/>
<path d="M63 220L139 248M535 199L459 246" fill="none" stroke="#805d51"/>
<!-- neck and face -->
<path d="M255 363L246 428Q300 461 358 428L347 361" fill="#b58d7b"/>
<path d="M164 160Q296 81 438 160L429 303Q411 365 302 408Q202 376 170 310Z" fill="#b58d7b"/>
<path d="M350 335Q325 356 302 355" fill="none" stroke="#956e5e" stroke-width="4"/>
<!-- forehead hair -->
<path d="M147 272Q113 194 153 112Q201 42 281 56Q364 26 427 91Q479 154 447 284L415 270Q434 172 373 113Q394 163 403 196Q341 179 294 103Q285 184 323 236Q250 205 243 120Q224 196 177 231L174 290Z" fill="#fff5e7"/>
<path d="M176 124Q149 176 157 218M211 85Q175 109 163 149M330 65Q380 80 404 117" fill="none" stroke="#d5bfb2" stroke-width="4"/>
<!-- brows eyes -->
<path d="M185 221Q211 208 245 213M337 204Q371 184 402 190" fill="none" stroke-width="4"/>
<path d="M181 249Q211 228 256 247L247 263Q213 276 185 261Z" fill="#fffaf0"/>
<path d="M333 240Q363 212 405 218L398 239Q368 257 336 252Z" fill="#fffaf0"/>
<path d="M213 240L235 243L232 266L212 268Z" fill="#d95356" stroke="none"/>
<path d="M365 226L389 221L383 245L362 249Z" fill="#d95356" stroke="none"/>
<path d="M223 247L225 258M376 228L374 239" stroke-width="4"/>
<path d="M178 246Q211 235 258 246M332 239Q369 218 408 217" fill="none" stroke-width="9"/>
<path d="M178 246L169 239M406 219L416 207" fill="none" stroke-width="6"/>
<!-- teeth grin -->
<path d="M246 337Q302 310 367 322Q316 357 246 337Z" fill="#53332d"/>
<path d="M253 335L265 325L275 340L288 320L300 336L315 317L328 331L343 318L353 325L335 340L322 331L307 347L293 335L280 348L270 338Z" fill="#fff7e9" stroke-width="2.5"/>
<!-- side hair visibly coming from scalp -->
<path d="M154 214Q154 271 201 290L219 310Q148 301 143 248Z" fill="#fff5e7"/>
<path d="M441 201Q456 264 401 277L379 306Q453 298 461 240Z" fill="#fff5e7"/>
<!-- hair moustache intertwined -->
<path d="M191 288Q231 286 285 302Q299 304 300 292Q305 308 319 297Q369 276 411 278Q394 311 352 308Q321 322 300 309Q270 333 238 318Q207 321 191 288Z" fill="#fff5e7" stroke-width="4"/>
<path d="M206 290L235 313L254 297L274 316L291 302M322 299L343 309L363 284L383 302L402 281" fill="none" stroke="#bfa79a" stroke-width="3"/>
<!-- connected side plaits under bare chin -->
<path d="M177 309Q194 386 271 426L294 415Q221 366 209 320Z" fill="#fff5e7"/>
<path d="M427 300Q420 378 329 426L309 410Q390 355 393 312Z" fill="#fff5e7"/>
<path d="M187 345L219 342L211 372L247 369L243 398L278 397M415 336L383 332L394 365L357 361L358 390L328 391" fill="none" stroke="#bfa79a" stroke-width="3"/>
<!-- chest braid -->
<g transform="translate(303 400)"><use href="#dwarf-plait"/><use href="#dwarf-plait" y="36"/><use href="#dwarf-plait" y="72"/><use href="#dwarf-plait" y="108"/></g>
<path d="M278 551L333 551L337 574L274 574Z" fill="#dfb358" stroke-width="4"/>
<path d="M289 556L320 556" stroke="#ffdf88" stroke-width="4"/>
<path d="M285 576Q251 604 271 639L289 631L301 654L318 632L336 639Q350 601 325 576Z" fill="#fff5e7"/>
<path d="M301 586L300 631M320 589L325 617" stroke="#cbb4a7" stroke-width="3"/>
<!-- low round spectacles -->
<g fill="#fff5e7" fill-opacity=".8" stroke="#574135" stroke-width="6"><ellipse cx="230" cy="286" rx="27" ry="21" transform="rotate(-8 230 286)"/><ellipse cx="367" cy="271" rx="27" ry="21" transform="rotate(-8 367 271)"/></g>
<g fill="none" stroke="#d7af61" stroke-width="3"><ellipse cx="230" cy="286" rx="27" ry="21" transform="rotate(-8 230 286)"/><ellipse cx="367" cy="271" rx="27" ry="21" transform="rotate(-8 367 271)"/><path d="M257 283Q299 257 339 272M203 286L179 275M394 265L423 249"/></g>
<!-- raised hand -->
<path d="M101 510L110 403Q94 358 116 327L144 303L152 276L188 263L207 268Q203 282 181 281L169 301L185 320L171 377Q166 425 154 489L128 536Z" fill="#b58d7b"/>
<path d="M113 342L146 326L171 332L163 357M114 365L140 351L158 360L153 384M146 303L168 301M127 401L129 377" fill="none" stroke="#805d51" stroke-width="4"/>
<path d="M88 504L130 544L154 499L154 573L111 600L74 552Z" fill="#f1deca"/>
</g>
</svg>`;
