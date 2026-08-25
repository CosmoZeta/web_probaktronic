
function setupModelSearchFilter(inputId = 'modelSearchInput', clearBtnId = 'clearModelSearchBtn', gridId = 'modelsListGrid', noResultsId = 'noModelSearchResults') {
  const input = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearBtnId);
  const grid = document.getElementById(gridId);
  if (!input || !grid) return;

  function filterCards() {
    const rawQuery = (input.value || '').trim();
    const query = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const queryClean = query.replace(/[^a-z0-9]/g, '');

    if (clearBtn) {
      if (rawQuery.length > 0) {
        clearBtn.classList.remove('d-none');
      } else {
        clearBtn.classList.add('d-none');
      }
    }

    const cards = grid.querySelectorAll('.model-item-card');
    let visibleCount = 0;

    cards.forEach(card => {
      if (!rawQuery) {
        card.style.display = 'flex';
        card.classList.remove('d-none');
        visibleCount++;
        return;
      }

      const cardText = (card.textContent || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cardClean = cardText.replace(/[^a-z0-9]/g, '');

      const words = query.split(/\s+/).filter(w => w.length > 0);
      const allWordsMatch = words.every(w => cardText.includes(w));
      const cleanMatch = queryClean.length > 1 && cardClean.includes(queryClean);

      if (allWordsMatch || cleanMatch) {
        card.style.display = 'flex';
        card.classList.remove('d-none');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('d-none');
      }
    });

    let noResultsEl = document.getElementById(noResultsId);
    if (visibleCount === 0 && rawQuery !== '' && cards.length > 0) {
      if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.id = noResultsId;
        noResultsEl.className = 'w-100 text-center py-5';
        noResultsEl.style.gridColumn = '1 / -1';
        grid.appendChild(noResultsEl);
      }
      noResultsEl.innerHTML = `
        <div style="color: #DC2626; font-size: 2.8rem; margin-bottom: 12px;"><i class="bi bi-search"></i></div>
        <h4 class="fw-bold text-dark mb-1">No se encontraron coincidencias</h4>
        <p class="text-muted small mb-0">No hay modelos que coincidan con "<strong>${rawQuery}</strong>". Intenta buscar por otro modelo, motor o combustible (Gasolina / Diésel).</p>
      `;
      noResultsEl.style.display = 'block';
    } else if (noResultsEl) {
      noResultsEl.style.display = 'none';
    }
  }

  input.oninput = filterCards;

  if (clearBtn) {
    clearBtn.onclick = () => {
      input.value = '';
      input.focus();
      filterCards();
    };
  }
}

// Vehiculos & Diagramas Controller for Probaktronic
// Conexión con Cloud Firestore (colección 'diagramas' / 'bobinas') y Firebase Storage

const localBrandLogoMap = {
  'audi': 'imagenes svg/ico_logo_audi.svg',
  'bmw': 'imagenes svg/ico_logo_bmw.svg',
  'byd': 'imagenes svg/ico_logo_byd.svg',
  'chevrolet': 'imagenes svg/ico_logo_chevrolet.png',
  'citroen': 'imagenes svg/ico_logo_citroen.svg',
  'dacia': 'imagenes svg/ico_logo_dacia.svg',
  'daihatsu': 'imagenes svg/ico_logo_daihatsu.svg',
  'fiat': 'imagenes svg/ico_logo_fiat.svg',
  'ford': 'imagenes svg/ico_logo_ford.svg',
  'gmc': 'imagenes svg/ico_logo_gmc.svg',
  'honda': 'imagenes svg/ico_logo_honda.svg',
  'hummer': 'imagenes svg/ico_logo_hummer.svg',
  'hyundai': 'imagenes svg/ico_logo_hyundai.svg',
  'infiniti': 'imagenes svg/ico_logo_infiniti.svg',
  'isuzu': 'imagenes svg/ico_logo_isuzu.svg',
  'kia': 'imagenes svg/ico_logo_kia.svg',
  'lada': 'imagenes svg/ico_logo_lada.svg',
  'lancia': 'imagenes svg/ico_logo_lancia.svg',
  'lotus': 'imagenes svg/ico_logo_lotus.svg',
  'mahindra': 'imagenes svg/ico_logo_mahindra.svg',
  'maruti': 'imagenes svg/ico_logo_maruti.svg',
  'mazda': 'imagenes svg/ico_logo_mazda.svg',
  'mercedes': 'imagenes svg/ico_logo_mercedes_benz.svg',
  'mercedes-benz': 'imagenes svg/ico_logo_mercedes_benz.svg',
  'mercedes_benz': 'imagenes svg/ico_logo_mercedes_benz.svg',
  'mini': 'imagenes svg/ico_logo_mini.svg',
  'mitsubishi': 'imagenes svg/ico_logo_mitsubishi.svg',
  'opel': 'imagenes svg/ico_logo_opel.svg',
  'peugeot': 'imagenes svg/ico_logo_peugeot.svg',
  'pontiac': 'imagenes svg/ico_logo_pontiac.svg',
  'porsche': 'imagenes svg/ico_logo_porsche.svg',
  'renault': 'imagenes svg/ico_logo_renault.svg',
  'seat': 'imagenes svg/ico_logo_seat.svg',
  'skoda': 'imagenes svg/ico_logo_skoda.svg',
  'subaru': 'imagenes svg/ico_logo_subaru.svg',
  'suzuki': 'imagenes svg/ico_logo_suzuki.svg',
  'toyota': 'imagenes svg/ico_logo_toyota.svg',
  'volkswagen': 'imagenes svg/ico_logo_volkswagen.svg',
  'vw': 'imagenes svg/ico_logo_volkswagen.svg',
  'wuling': 'imagenes svg/ico_logo_wuling.png',
  'zotye': 'imagenes svg/ico_logo_zotye.svg'
};

const localCarPhotoLibrary = [{"file":"imagenes autos/ic_car_audia3.JPG","brand":"audi","model":"a3","modelNoSpaces":"a3","year":null},{"file":"imagenes autos/ic_car_audi_a4.JPG","brand":"audi","model":"a4","modelNoSpaces":"a4","year":null},{"file":"imagenes autos/ic_car_audi_q7.JPG","brand":"audi","model":"q7","modelNoSpaces":"q7","year":null},{"file":"imagenes autos/ic_car_audi_tiguan.JPG","brand":"audi","model":"tiguan","modelNoSpaces":"tiguan","year":null},{"file":"imagenes autos/ic_car_audi_tt.JPG","brand":"audi","model":"tt","modelNoSpaces":"tt","year":null},{"file":"imagenes autos/ic_car_bmw_118_2007.JPG","brand":"bmw","model":"118","modelNoSpaces":"118","year":2007},{"file":"imagenes autos/ic_car_chevrolet_captiva_2011.JPG","brand":"chevrolet","model":"captiva","modelNoSpaces":"captiva","year":2011},{"file":"imagenes autos/ic_car_chevrolet_chevy.JPG","brand":"chevrolet","model":"chevy","modelNoSpaces":"chevy","year":null},{"file":"imagenes autos/ic_car_chevrolet_colorado_2006.JPG","brand":"chevrolet","model":"colorado","modelNoSpaces":"colorado","year":2006},{"file":"imagenes autos/ic_car_chevrolet_sail_2010.JPG","brand":"chevrolet","model":"sail","modelNoSpaces":"sail","year":2010},{"file":"imagenes autos/ic_car_chevrolet_trailblazer_2002.JPG","brand":"chevrolet","model":"trailblazer","modelNoSpaces":"trailblazer","year":2002},{"file":"imagenes autos/ic_car_Citroen_Berlingo_2015.JPG","brand":"citroen","model":"berlingo","modelNoSpaces":"berlingo","year":2015},{"file":"imagenes autos/ic_car_citroen_c3_aircross.JPG","brand":"citroen","model":"c3 aircross","modelNoSpaces":"c3aircross","year":null},{"file":"imagenes autos/ic_car_citroen_c3_mk3.JPG","brand":"citroen","model":"c3 mk3","modelNoSpaces":"c3mk3","year":null},{"file":"imagenes autos/ic_car_citroen_c3_tercera_generacion.jpg","brand":"citroen","model":"c3 tercera generacion","modelNoSpaces":"c3tercerageneracion","year":null},{"file":"imagenes autos/ic_car_citroen_cactus.JPG","brand":"citroen","model":"cactus","modelNoSpaces":"cactus","year":null},{"file":"imagenes autos/ic_car_Citroen_Citroen_C3_mk3.JPG","brand":"citroen","model":"citroen c3 mk3","modelNoSpaces":"citroenc3mk3","year":null},{"file":"imagenes autos/ic_car_Citroen_Citroen_C3_tercera_generacion.JPG","brand":"citroen","model":"citroen c3 tercera generacion","modelNoSpaces":"citroenc3tercerageneracion","year":null},{"file":"imagenes autos/ic_car_citroen_picasso.JPG","brand":"citroen","model":"picasso","modelNoSpaces":"picasso","year":null},{"file":"imagenes autos/ic_car_citroen_saxo.JPG","brand":"citroen","model":"saxo","modelNoSpaces":"saxo","year":null},{"file":"imagenes autos/ic_car_citroen_xsara.JPG","brand":"citroen","model":"xsara","modelNoSpaces":"xsara","year":null},{"file":"imagenes autos/ic_car_dacia_duster.JPG","brand":"dacia","model":"duster","modelNoSpaces":"duster","year":null},{"file":"imagenes autos/ic_car_dacia_lodgy.JPG","brand":"dacia","model":"lodgy","modelNoSpaces":"lodgy","year":null},{"file":"imagenes autos/ic_car_daihatsu_copen.JPG","brand":"daihatsu","model":"copen","modelNoSpaces":"copen","year":null},{"file":"imagenes autos/ic_car_daihatsu_materia.JPG","brand":"daihatsu","model":"materia","modelNoSpaces":"materia","year":null},{"file":"imagenes autos/ic_car_daihatsu_sirion.JPG","brand":"daihatsu","model":"sirion","modelNoSpaces":"sirion","year":null},{"file":"imagenes autos/ic_car_daihatsu_terios.JPG","brand":"daihatsu","model":"terios","modelNoSpaces":"terios","year":null},{"file":"imagenes autos/ic_car_fiat_abarth.JPG","brand":"fiat","model":"abarth","modelNoSpaces":"abarth","year":null},{"file":"imagenes autos/ic_car_fiat_brava.JPG","brand":"fiat","model":"brava","modelNoSpaces":"brava","year":null},{"file":"imagenes autos/ic_car_fiat_coupe.JPG","brand":"fiat","model":"coupe","modelNoSpaces":"coupe","year":null},{"file":"imagenes autos/ic_car_fiat_coupe_2000.JPG","brand":"fiat","model":"coupe","modelNoSpaces":"coupe","year":2000},{"file":"imagenes autos/ic_car_fiat_doblo.JPG","brand":"fiat","model":"doblo","modelNoSpaces":"doblo","year":null},{"file":"imagenes autos/ic_car_fiat_marea.JPG","brand":"fiat","model":"marea","modelNoSpaces":"marea","year":null},{"file":"imagenes autos/ic_car_fiat_marea_1999.JPG","brand":"fiat","model":"marea","modelNoSpaces":"marea","year":1999},{"file":"imagenes autos/ic_car_fiat_multipla.JPG","brand":"fiat","model":"multipla","modelNoSpaces":"multipla","year":null},{"file":"imagenes autos/ic_car_fiat_palio_weekend.JPG","brand":"fiat","model":"palio weekend","modelNoSpaces":"palioweekend","year":null},{"file":"imagenes autos/ic_car_fiat_sedici.JPG","brand":"fiat","model":"sedici","modelNoSpaces":"sedici","year":null},{"file":"imagenes autos/ic_car_fiat_stilo.JPG","brand":"fiat","model":"stilo","modelNoSpaces":"stilo","year":null},{"file":"imagenes autos/ic_car_ford_ecosport.JPG","brand":"ford","model":"ecosport","modelNoSpaces":"ecosport","year":null},{"file":"imagenes autos/ic_car_ford_expedition.JPG","brand":"ford","model":"expedition","modelNoSpaces":"expedition","year":null},{"file":"imagenes autos/ic_car_ford_explorer.JPG","brand":"ford","model":"explorer","modelNoSpaces":"explorer","year":null},{"file":"imagenes autos/ic_car_ford_f150.JPG","brand":"ford","model":"f150","modelNoSpaces":"f150","year":null},{"file":"imagenes autos/ic_car_ford_fiesta.JPG","brand":"ford","model":"fiesta","modelNoSpaces":"fiesta","year":null},{"file":"imagenes autos/ic_car_ford_focus.JPG","brand":"ford","model":"focus","modelNoSpaces":"focus","year":null},{"file":"imagenes autos/ic_car_ford_mustang.JPG","brand":"ford","model":"mustang","modelNoSpaces":"mustang","year":null},{"file":"imagenes autos/ic_car_honda_airwave.jpg","brand":"honda","model":"airwave","modelNoSpaces":"airwave","year":null},{"file":"imagenes autos/ic_car_honda_city.jpg","brand":"honda","model":"city","modelNoSpaces":"city","year":null},{"file":"imagenes autos/ic_car_honda_civic.jpg","brand":"honda","model":"civic","modelNoSpaces":"civic","year":null},{"file":"imagenes autos/ic_car_honda_fit.jpg","brand":"honda","model":"fit","modelNoSpaces":"fit","year":null},{"file":"imagenes autos/ic_car_honda_fit_2002.jpg","brand":"honda","model":"fit","modelNoSpaces":"fit","year":2002},{"file":"imagenes autos/ic_car_honda_jazz.jpg","brand":"honda","model":"jazz","modelNoSpaces":"jazz","year":null},{"file":"imagenes autos/ic_car_honda_mobilo.jpg","brand":"honda","model":"mobilo","modelNoSpaces":"mobilo","year":null},{"file":"imagenes autos/ic_car_hummer_h3.jpg","brand":"hummer","model":"h3","modelNoSpaces":"h3","year":null},{"file":"imagenes autos/ic_car_hyundai_accent.jpg","brand":"hyundai","model":"accent","modelNoSpaces":"accent","year":null},{"file":"imagenes autos/ic_car_hyundai_atos.jpg","brand":"hyundai","model":"atos","modelNoSpaces":"atos","year":null},{"file":"imagenes autos/ic_car_hyundai_elantra.jpg","brand":"hyundai","model":"elantra","modelNoSpaces":"elantra","year":null},{"file":"imagenes autos/ic_car_hyundai_elantra_2020.jpg","brand":"hyundai","model":"elantra","modelNoSpaces":"elantra","year":2020},{"file":"imagenes autos/ic_car_hyundai_i10_2007.JPG","brand":"hyundai","model":"i10","modelNoSpaces":"i10","year":2007},{"file":"imagenes autos/ic_car_hyundai_i30_2007.JPG","brand":"hyundai","model":"i30","modelNoSpaces":"i30","year":2007},{"file":"imagenes autos/ic_car_hyundai_i30_2012.JPG","brand":"hyundai","model":"i30","modelNoSpaces":"i30","year":2012},{"file":"imagenes autos/ic_car_hyundai_santafe_2003.JPG","brand":"hyundai","model":"santafe","modelNoSpaces":"santafe","year":2003},{"file":"imagenes autos/ic_car_hyundai_santafe_2006.jpg","brand":"hyundai","model":"santafe","modelNoSpaces":"santafe","year":2006},{"file":"imagenes autos/ic_car_hyundai_santro_2014.jpg","brand":"hyundai","model":"santro","modelNoSpaces":"santro","year":2014},{"file":"imagenes autos/ic_car_hyundai_sonata_2005.jpg","brand":"hyundai","model":"sonata","modelNoSpaces":"sonata","year":2005},{"file":"imagenes autos/ic_car_hyundai_terracan_2001.JPG","brand":"hyundai","model":"terracan","modelNoSpaces":"terracan","year":2001},{"file":"imagenes autos/ic_car_hyundai_tucson_2015.JPG","brand":"hyundai","model":"tucson","modelNoSpaces":"tucson","year":2015},{"file":"imagenes autos/ic_car_hyundai_xg350_2005.JPG","brand":"hyundai","model":"xg350","modelNoSpaces":"xg350","year":2005},{"file":"imagenes autos/ic_car_infiniti_i30_2004.JPG","brand":"infiniti","model":"i30","modelNoSpaces":"i30","year":2004},{"file":"imagenes autos/ic_car_infiniti_qx4_2003.JPG","brand":"infiniti","model":"qx4","modelNoSpaces":"qx4","year":2003},{"file":"imagenes autos/ic_car_isuzu_290_2007.JPG","brand":"isuzu","model":"290","modelNoSpaces":"290","year":2007},{"file":"imagenes autos/ic_car_isuzu_ascender_2003.JPG","brand":"isuzu","model":"ascender","modelNoSpaces":"ascender","year":2003},{"file":"imagenes autos/ic_car_isuzu_i280_2006.JPG","brand":"isuzu","model":"i280","modelNoSpaces":"i280","year":2006},{"file":"imagenes autos/ic_car_kia_amanti_2004.JPG","brand":"kia","model":"amanti","modelNoSpaces":"amanti","year":2004},{"file":"imagenes autos/ic_car_kia_carnival_2005.JPG","brand":"kia","model":"carnival","modelNoSpaces":"carnival","year":2005},{"file":"imagenes autos/ic_car_kia_cerato_2008.JPG","brand":"kia","model":"cerato","modelNoSpaces":"cerato","year":2008},{"file":"imagenes autos/ic_car_kia_opirus_2004.JPG","brand":"kia","model":"opirus","modelNoSpaces":"opirus","year":2004},{"file":"imagenes autos/ic_car_kia_opirus_2006.JPG","brand":"kia","model":"opirus","modelNoSpaces":"opirus","year":2006},{"file":"imagenes autos/ic_car_kia_optima_2006.JPG","brand":"kia","model":"optima","modelNoSpaces":"optima","year":2006},{"file":"imagenes autos/ic_car_kia_optima_2019.JPG","brand":"kia","model":"optima","modelNoSpaces":"optima","year":2019},{"file":"imagenes autos/ic_car_kia_picanto_2004.JPG","brand":"kia","model":"picanto","modelNoSpaces":"picanto","year":2004},{"file":"imagenes autos/ic_car_kia_rio_2011.JPG","brand":"kia","model":"rio","modelNoSpaces":"rio","year":2011},{"file":"imagenes autos/ic_car_kia_sedona_2005.JPG","brand":"kia","model":"sedona","modelNoSpaces":"sedona","year":2005},{"file":"imagenes autos/ic_car_kia_sorento_2006.JPG","brand":"kia","model":"sorento","modelNoSpaces":"sorento","year":2006},{"file":"imagenes autos/ic_car_kia_soul_2011.JPG","brand":"kia","model":"soul","modelNoSpaces":"soul","year":2011},{"file":"imagenes autos/ic_car_kia_soul_2019.JPG","brand":"kia","model":"soul","modelNoSpaces":"soul","year":2019},{"file":"imagenes autos/ic_car_kia_sportage_2021.JPG","brand":"kia","model":"sportage","modelNoSpaces":"sportage","year":2021},{"file":"imagenes autos/ic_car_lacia_kappa_2001.jpg","brand":"lacia","model":"kappa","modelNoSpaces":"kappa","year":2001},{"file":"imagenes autos/ic_car_lada_110_2012.jpg","brand":"lada","model":"110","modelNoSpaces":"110","year":2012},{"file":"imagenes autos/ic_car_lada_111_2009.jpg","brand":"lada","model":"111","modelNoSpaces":"111","year":2009},{"file":"imagenes autos/ic_car_lada_112_2008.jpg","brand":"lada","model":"112","modelNoSpaces":"112","year":2008},{"file":"imagenes autos/ic_car_lada_granta_2021.jpg","brand":"lada","model":"granta","modelNoSpaces":"granta","year":2021},{"file":"imagenes autos/ic_car_lada_kalina_2013.jpg","brand":"lada","model":"kalina","modelNoSpaces":"kalina","year":2013},{"file":"imagenes autos/ic_car_lada_niva_2020.jpg","brand":"lada","model":"niva","modelNoSpaces":"niva","year":2020},{"file":"imagenes autos/ic_car_lada_priora_2007.jpg","brand":"lada","model":"priora","modelNoSpaces":"priora","year":2007},{"file":"imagenes autos/ic_car_lancia_2005.jpg","brand":"lancia","model":"","modelNoSpaces":"","year":2005},{"file":"imagenes autos/ic_car_lancia_lybra_1999.jpg","brand":"lancia","model":"lybra","modelNoSpaces":"lybra","year":1999},{"file":"imagenes autos/ic_car_lancia_thesis_2009.jpg","brand":"lancia","model":"thesis","modelNoSpaces":"thesis","year":2009},{"file":"imagenes autos/ic_car_lotus_elise_2011.jpg","brand":"lotus","model":"elise","modelNoSpaces":"elise","year":2011},{"file":"imagenes autos/ic_car_mahindra_scorpio_2014.jpg","brand":"mahindra","model":"scorpio","modelNoSpaces":"scorpio","year":2014},{"file":"imagenes autos/ic_car_maruti_suzuki_2022.jpg","brand":"maruti","model":"suzuki","modelNoSpaces":"suzuki","year":2022},{"file":"imagenes autos/ic_car_mazda_323_2001.jpg","brand":"mazda","model":"323","modelNoSpaces":"323","year":2001},{"file":"imagenes autos/ic_car_mazda_323_2003.jpg","brand":"mazda","model":"323","modelNoSpaces":"323","year":2003},{"file":"imagenes autos/ic_car_mazda_3_2009.jpg","brand":"mazda","model":"3","modelNoSpaces":"3","year":2009},{"file":"imagenes autos/ic_car_mazda_3_2018.jpg","brand":"mazda","model":"3","modelNoSpaces":"3","year":2018},{"file":"imagenes autos/ic_car_mazda_5_2010.jpg","brand":"mazda","model":"5","modelNoSpaces":"5","year":2010},{"file":"imagenes autos/ic_car_mazda_626_2002.jpg","brand":"mazda","model":"626","modelNoSpaces":"626","year":2002},{"file":"imagenes autos/ic_car_mazda_6_2008.jpg","brand":"mazda","model":"6","modelNoSpaces":"6","year":2008},{"file":"imagenes autos/ic_car_mazda_6_2018.jpg","brand":"mazda","model":"6","modelNoSpaces":"6","year":2018},{"file":"imagenes autos/ic_car_mazda_allegro_2001.jpg","brand":"mazda","model":"allegro","modelNoSpaces":"allegro","year":2001},{"file":"imagenes autos/ic_car_mazda_allegro_2004.jpg","brand":"mazda","model":"allegro","modelNoSpaces":"allegro","year":2004},{"file":"imagenes autos/ic_car_mazda_cx5_2018.jpg","brand":"mazda","model":"cx5","modelNoSpaces":"cx5","year":2018},{"file":"imagenes autos/ic_car_mazda_premacy_2005.jpg","brand":"mazda","model":"premacy","modelNoSpaces":"premacy","year":2005},{"file":"imagenes autos/ic_car_mercedes_clase_a_2024.JPG","brand":"mercedes","model":"clase a","modelNoSpaces":"clasea","year":2024},{"file":"imagenes autos/ic_car_mini_cooper_2013.JPG","brand":"mini","model":"cooper","modelNoSpaces":"cooper","year":2013},{"file":"imagenes autos/ic_car_mitsubishi_galant_1992.JPG","brand":"mitsubishi","model":"galant","modelNoSpaces":"galant","year":1992},{"file":"imagenes autos/ic_car_mitsubishi_lancer_1990.JPG","brand":"mitsubishi","model":"lancer","modelNoSpaces":"lancer","year":1990},{"file":"imagenes autos/ic_car_mitsubishi_lancer_2009.JPG","brand":"mitsubishi","model":"lancer","modelNoSpaces":"lancer","year":2009},{"file":"imagenes autos/ic_car_mitsubishi_mirage_1996.JPG","brand":"mitsubishi","model":"mirage","modelNoSpaces":"mirage","year":1996},{"file":"imagenes autos/ic_car_mitsubishi_spacestar_2005.JPG","brand":"mitsubishi","model":"spacestar","modelNoSpaces":"spacestar","year":2005},{"file":"imagenes autos/ic_car_nissan_maxima_2000.JPG","brand":"nissan","model":"maxima","modelNoSpaces":"maxima","year":2000},{"file":"imagenes autos/ic_car_nissan_maxima_2003.JPG","brand":"nissan","model":"maxima","modelNoSpaces":"maxima","year":2003},{"file":"imagenes autos/ic_car_nissan_murano_2003.JPG","brand":"nissan","model":"murano","modelNoSpaces":"murano","year":2003},{"file":"imagenes autos/ic_car_nissan_murano_2007.JPG","brand":"nissan","model":"murano","modelNoSpaces":"murano","year":2007},{"file":"imagenes autos/ic_car_nissan_pathfinder_2001.JPG","brand":"nissan","model":"pathfinder","modelNoSpaces":"pathfinder","year":2001},{"file":"imagenes autos/ic_car_nissan_pathfinder_2004.JPG","brand":"nissan","model":"pathfinder","modelNoSpaces":"pathfinder","year":2004},{"file":"imagenes autos/ic_car_nissan_pixo_2009.JPG","brand":"nissan","model":"pixo","modelNoSpaces":"pixo","year":2009},{"file":"imagenes autos/ic_car_nissan_qashqai_2024.JPG","brand":"nissan","model":"qashqai","modelNoSpaces":"qashqai","year":2024},{"file":"imagenes autos/ic_car_nissan_qg15_2006.JPG","brand":"nissan","model":"qg15","modelNoSpaces":"qg15","year":2006},{"file":"imagenes autos/ic_car_nissan_xtrail_2024.JPG","brand":"nissan","model":"xtrail","modelNoSpaces":"xtrail","year":2024},{"file":"imagenes autos/ic_car_opel_agila_2014.JPG","brand":"opel","model":"agila","modelNoSpaces":"agila","year":2014},{"file":"imagenes autos/ic_car_opel_corsa_2024.JPG","brand":"opel","model":"corsa","modelNoSpaces":"corsa","year":2024},{"file":"imagenes autos/ic_car_opel_crossland_x_2017.JPG","brand":"opel","model":"crossland x","modelNoSpaces":"crosslandx","year":2017},{"file":"imagenes autos/ic_car_peugeot_106_2004.JPG","brand":"peugeot","model":"106","modelNoSpaces":"106","year":2004},{"file":"imagenes autos/ic_car_peugeot_2008_2003.JPG","brand":"peugeot","model":"","modelNoSpaces":"","year":2008},{"file":"imagenes autos/ic_car_peugeot_2008_2015.JPG","brand":"peugeot","model":"","modelNoSpaces":"","year":2008},{"file":"imagenes autos/ic_car_peugeot_206_1998.JPG","brand":"peugeot","model":"206","modelNoSpaces":"206","year":1998},{"file":"imagenes autos/ic_car_peugeot_208_2012.JPG","brand":"peugeot","model":"208","modelNoSpaces":"208","year":2012},{"file":"imagenes autos/ic_car_peugeot_208_2015.JPG","brand":"peugeot","model":"208","modelNoSpaces":"208","year":2015},{"file":"imagenes autos/ic_car_peugeot_208_2018.JPG","brand":"peugeot","model":"208","modelNoSpaces":"208","year":2018},{"file":"imagenes autos/ic_car_peugeot_3008_2016.JPG","brand":"peugeot","model":"3008","modelNoSpaces":"3008","year":2016},{"file":"imagenes autos/ic_car_peugeot_3008_2020.JPG","brand":"peugeot","model":"3008","modelNoSpaces":"3008","year":2020},{"file":"imagenes autos/ic_car_peugeot_306_2002.JPG","brand":"peugeot","model":"306","modelNoSpaces":"306","year":2002},{"file":"imagenes autos/ic_car_peugeot_308_2008.JPG","brand":"peugeot","model":"308","modelNoSpaces":"308","year":2008},{"file":"imagenes autos/ic_car_peugeot_308_2013.JPG","brand":"peugeot","model":"308","modelNoSpaces":"308","year":2013},{"file":"imagenes autos/ic_car_peugeot_308_2014.JPG","brand":"peugeot","model":"308","modelNoSpaces":"308","year":2014},{"file":"imagenes autos/ic_car_peugeot_406_2004.JPG","brand":"peugeot","model":"406","modelNoSpaces":"406","year":2004},{"file":"imagenes autos/ic_car_peugeot_408_2010.JPG","brand":"peugeot","model":"408","modelNoSpaces":"408","year":2010},{"file":"imagenes autos/ic_car_peugeot_partner_2008.JPG","brand":"peugeot","model":"partner","modelNoSpaces":"partner","year":2008},{"file":"imagenes autos/ic_car_peugeot_partner_rifter_2015.JPG","brand":"peugeot","model":"partner rifter","modelNoSpaces":"partnerrifter","year":2015},{"file":"imagenes autos/ic_car_porsche_cayenne_2003.JPG","brand":"porsche","model":"cayenne","modelNoSpaces":"cayenne","year":2003},{"file":"imagenes autos/ic_car_porsche_cayenne_2010.JPG","brand":"porsche","model":"cayenne","modelNoSpaces":"cayenne","year":2010},{"file":"imagenes autos/ic_car_porsche_panamera_2009.JPG","brand":"porsche","model":"panamera","modelNoSpaces":"panamera","year":2009},{"file":"imagenes autos/ic_car_renault_arkana_2019.JPG","brand":"renault","model":"arkana","modelNoSpaces":"arkana","year":2019},{"file":"imagenes autos/ic_car_renault_captur_2024.JPG","brand":"renault","model":"captur","modelNoSpaces":"captur","year":2024},{"file":"imagenes autos/ic_car_renault_clioll_2009.JPG","brand":"renault","model":"clioll","modelNoSpaces":"clioll","year":2009},{"file":"imagenes autos/ic_car_renault_clio_2019.JPG","brand":"renault","model":"clio","modelNoSpaces":"clio","year":2019},{"file":"imagenes autos/ic_car_renault_duster_2020.JPG","brand":"renault","model":"duster","modelNoSpaces":"duster","year":2020},{"file":"imagenes autos/ic_car_renault_kadja_2018.JPG","brand":"renault","model":"kadja","modelNoSpaces":"kadja","year":2018},{"file":"imagenes autos/ic_car_renault_kangoo_2012.JPG","brand":"renault","model":"kangoo","modelNoSpaces":"kangoo","year":2012},{"file":"imagenes autos/ic_car_renault_logan_2013.JPG","brand":"renault","model":"logan","modelNoSpaces":"logan","year":2013},{"file":"imagenes autos/ic_car_renault_megane_2009.JPG","brand":"renault","model":"megane","modelNoSpaces":"megane","year":2009},{"file":"imagenes autos/ic_car_renault_sandero_2007.JPG","brand":"renault","model":"sandero","modelNoSpaces":"sandero","year":2007},{"file":"imagenes autos/ic_car_renault_scenic_2009.JPG","brand":"renault","model":"scenic","modelNoSpaces":"scenic","year":2009},{"file":"imagenes autos/ic_car_seat_cordoba_2009.JPG","brand":"seat","model":"cordoba","modelNoSpaces":"cordoba","year":2009},{"file":"imagenes autos/ic_car_seat_ibiza_2015.JPG","brand":"seat","model":"ibiza","modelNoSpaces":"ibiza","year":2015},{"file":"imagenes autos/ic_car_skoda_fabia_2014.JPG","brand":"skoda","model":"fabia","modelNoSpaces":"fabia","year":2014},{"file":"imagenes autos/ic_car_subaru_forester_2010.JPG","brand":"subaru","model":"forester","modelNoSpaces":"forester","year":2010},{"file":"imagenes autos/ic_car_subaru_impreza_2011.JPG","brand":"subaru","model":"impreza","modelNoSpaces":"impreza","year":2011},{"file":"imagenes autos/ic_car_subaru_legacy_2009.JPG","brand":"subaru","model":"legacy","modelNoSpaces":"legacy","year":2009},{"file":"imagenes autos/ic_car_subaru_outback_2009.JPG","brand":"subaru","model":"outback","modelNoSpaces":"outback","year":2009},{"file":"imagenes autos/ic_car_suzuki_alto_2005.JPG","brand":"suzuki","model":"alto","modelNoSpaces":"alto","year":2005},{"file":"imagenes autos/ic_car_suzuki_alto_2009.JPG","brand":"suzuki","model":"alto","modelNoSpaces":"alto","year":2009},{"file":"imagenes autos/ic_car_suzuki_celerio_2021.JPG","brand":"suzuki","model":"celerio","modelNoSpaces":"celerio","year":2021},{"file":"imagenes autos/ic_car_suzuki_grandnomade_2005.JPG","brand":"suzuki","model":"grandnomade","modelNoSpaces":"grandnomade","year":2005},{"file":"imagenes autos/ic_car_suzuki_grandvitara_2005.JPG","brand":"suzuki","model":"grandvitara","modelNoSpaces":"grandvitara","year":2005},{"file":"imagenes autos/ic_car_suzuki_jummy_2008.JPG","brand":"suzuki","model":"jummy","modelNoSpaces":"jummy","year":2008},{"file":"imagenes autos/ic_car_suzuki_splash_2008.JPG","brand":"suzuki","model":"splash","modelNoSpaces":"splash","year":2008},{"file":"imagenes autos/ic_car_suzuki_swift_2010.JPG","brand":"suzuki","model":"swift","modelNoSpaces":"swift","year":2010},{"file":"imagenes autos/ic_car_suzuki_wagon_r_2014.JPG","brand":"suzuki","model":"wagon r","modelNoSpaces":"wagonr","year":2014},{"file":"imagenes autos/ic_car_suzuki_xl7_2009.JPG","brand":"suzuki","model":"xl7","modelNoSpaces":"xl7","year":2009},{"file":"imagenes autos/ic_car_toyota_avanza_2015.JPG","brand":"toyota","model":"avanza","modelNoSpaces":"avanza","year":2015},{"file":"imagenes autos/ic_car_toyota_celica_2006.JPG","brand":"toyota","model":"celica","modelNoSpaces":"celica","year":2006},{"file":"imagenes autos/ic_car_toyota_corolla_2000.JPG","brand":"toyota","model":"corolla","modelNoSpaces":"corolla","year":2000},{"file":"imagenes autos/ic_car_toyota_corolla_2007.JPG","brand":"toyota","model":"corolla","modelNoSpaces":"corolla","year":2007},{"file":"imagenes autos/ic_car_toyota_corolla_2009.JPG","brand":"toyota","model":"corolla","modelNoSpaces":"corolla","year":2009},{"file":"imagenes autos/ic_car_toyota_echo_2005.JPG","brand":"toyota","model":"echo","modelNoSpaces":"echo","year":2005},{"file":"imagenes autos/ic_car_toyota_hilux_2011.JPG","brand":"toyota","model":"hilux","modelNoSpaces":"hilux","year":2011},{"file":"imagenes autos/ic_car_toyota_matrix_2008.JPG","brand":"toyota","model":"matrix","modelNoSpaces":"matrix","year":2008},{"file":"imagenes autos/ic_car_toyota_matrix_2009.JPG","brand":"toyota","model":"matrix","modelNoSpaces":"matrix","year":2009},{"file":"imagenes autos/ic_car_toyota_mrs_spyder_2007.JPG","brand":"toyota","model":"mrs spyder","modelNoSpaces":"mrsspyder","year":2007},{"file":"imagenes autos/ic_car_toyota_prius_2010.JPG","brand":"toyota","model":"prius","modelNoSpaces":"prius","year":2010},{"file":"imagenes autos/ic_car_toyota_probo_2005.JPG","brand":"toyota","model":"probo","modelNoSpaces":"probo","year":2005},{"file":"imagenes autos/ic_car_toyota_rav4_2005.JPG","brand":"toyota","model":"rav4","modelNoSpaces":"rav4","year":2005},{"file":"imagenes autos/ic_car_toyota_rush_2017.JPG","brand":"toyota","model":"rush","modelNoSpaces":"rush","year":2017},{"file":"imagenes autos/ic_car_toyota_yaris_2005.JPG","brand":"toyota","model":"yaris","modelNoSpaces":"yaris","year":2005},{"file":"imagenes autos/ic_car_volkswagen_bora_2005.JPG","brand":"volkswagen","model":"bora","modelNoSpaces":"bora","year":2005},{"file":"imagenes autos/ic_car_volkswagen_fox_2011.JPG","brand":"volkswagen","model":"fox","modelNoSpaces":"fox","year":2011},{"file":"imagenes autos/ic_car_volkswagen_golf_2008.JPG","brand":"volkswagen","model":"golf","modelNoSpaces":"golf","year":2008},{"file":"imagenes autos/ic_car_volkswagen_gol_2012.JPG","brand":"volkswagen","model":"gol","modelNoSpaces":"gol","year":2012},{"file":"imagenes autos/ic_car_volkswagen_passat_2015.JPG","brand":"volkswagen","model":"passat","modelNoSpaces":"passat","year":2015},{"file":"imagenes autos/ic_car_volkswagen_phateon_2016.JPG","brand":"volkswagen","model":"phateon","modelNoSpaces":"phateon","year":2016},{"file":"imagenes autos/ic_car_volkswagen_polo_2014.JPG","brand":"volkswagen","model":"polo","modelNoSpaces":"polo","year":2014},{"file":"imagenes autos/ic_car_volkswagen_tiguan_2008.JPG","brand":"volkswagen","model":"tiguan","modelNoSpaces":"tiguan","year":2008},{"file":"imagenes autos/ic_car_volkswagen_touareg_2018.JPG","brand":"volkswagen","model":"touareg","modelNoSpaces":"touareg","year":2018}];

function getVehicleCarPhotoUrl(brandName, modelName, docId) {
  const query = ((brandName || '') + ' ' + (modelName || '') + ' ' + (docId || '')).toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanBrand = (brandName || '').toLowerCase().trim();
  const candidates = localCarPhotoLibrary.filter(c => c.brand === cleanBrand || query.includes(c.brand));
  if (candidates.length === 0) return null;

  const years = (query.match(/\b(19\d\d|20\d\d)\b/g) || []).map(y => parseInt(y, 10));
  let best = null;
  let bestScore = 0;

  for (const c of candidates) {
    let score = 0;
    if (c.model && c.model.length > 0 && query.includes(c.model)) {
      score += 15 + c.model.length * 2;
    } else if (c.modelNoSpaces && c.modelNoSpaces.length > 0 && query.includes(c.modelNoSpaces)) {
      score += 15 + c.modelNoSpaces.length * 2;
    } else {
      const words = c.model.split(' ').filter(w => w.length > 1);
      if (words.length > 0 && words.every(w => query.includes(w))) {
        score += 10 + words.length * 3;
      }
    }
    if (score > 0) {
      if (c.year && years.length > 0) {
        const minYear = Math.min(...years);
        if (years.length >= 2) {
          if (Math.abs(c.year - minYear) <= 4) {
            score += 25;
          } else {
            score -= 30;
          }
        } else {
          if (Math.abs(c.year - years[0]) <= 4) {
            score += 25;
          } else {
            score -= 30;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }
  return (bestScore >= 12 && best) ? best.file : null;
}

function getBrandLogoUrl(brandKey) {
  const clean = brandKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of Object.keys(localBrandLogoMap)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean === cleanKey || clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return localBrandLogoMap[key];
    }
  }
  return 'logo_probaktronic_solo.png';
}

let currentSelectedBrandId = null;
let currentSelectedBrandName = null;
window.currentModelsDataStore = {};

function initVehiculosDiagramasModule() {
  setupModelSearchFilter();
  const searchInput = document.getElementById('brandSearchInput');
  const alphabetLetters = document.querySelectorAll('.alphabet-letter');
  const brandGrid = document.getElementById('vehiculosBrandGrid');
  const tabs = document.querySelectorAll('.section-tab-item');
  const btnBackView = document.getElementById('btnBackView');

  if (!brandGrid) return;

  // Search input filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = brandGrid.querySelectorAll('.brand-card');

      cards.forEach(card => {
        const brand = (card.getAttribute('data-brand') || card.textContent).toLowerCase();
        card.style.display = brand.includes(query) ? 'flex' : 'none';
      });
    });
  }

  // Alphabetical Index Filter
  alphabetLetters.forEach(letterEl => {
    letterEl.addEventListener('click', () => {
      alphabetLetters.forEach(l => l.classList.remove('active'));
      letterEl.classList.add('active');

      const selectedLetter = letterEl.getAttribute('data-letter');
      const cards = brandGrid.querySelectorAll('.brand-card');

      cards.forEach(card => {
        const brand = (card.getAttribute('data-brand') || card.textContent).trim();
        if (selectedLetter === 'all') {
          card.style.display = 'flex';
        } else {
          card.style.display = brand.toUpperCase().startsWith(selectedLetter) ? 'flex' : 'none';
        }
      });
    });
  });

  // Tab switcher
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Smart Top-Left Back Button Handler (Hierarchical Step-by-Step Navigation)
  if (btnBackView) {
    btnBackView.onclick = (e) => {
      const brandsView = document.getElementById('brandsViewContainer');
      const modelsView = document.getElementById('modelsViewContainer');
      const ecuView = document.getElementById('ecuInfoViewContainer');
      const diagramView = document.getElementById('diagramViewContainer');

      const fuelView = document.getElementById('fuelSelectorViewContainer');
      const dieselCatView = document.getElementById('dieselCategoriesViewContainer');
      const gasCatView = document.getElementById('gasolinaCategoriesViewContainer');

      if (diagramView && !diagramView.classList.contains('d-none')) {
        e.preventDefault();
        showEcuInfoView();
        return;
      }

      if (ecuView && !ecuView.classList.contains('d-none')) {
        e.preventDefault();
        showModelsView();
        return;
      }

      if (modelsView && !modelsView.classList.contains('d-none')) {
        e.preventDefault();
        showBrandsView();
        return;
      }

      if (brandsView && !brandsView.classList.contains('d-none')) {
        e.preventDefault();
        returnFuelTypeView();
        return;
      }

      if ((dieselCatView && !dieselCatView.classList.contains('d-none')) || (gasCatView && !gasCatView.classList.contains('d-none'))) {
        e.preventDefault();
        showFuelSelectorView();
        return;
      }
      // If at Level 1 (fuelView), default link to index.html takes effect!
    };
  }

  // Query Firestore collection 'diagramas' to render only active brands
  loadFirestoreDiagramasBrands(brandGrid);
}

window.initVehiculosDiagramasModule = initVehiculosDiagramasModule;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVehiculosDiagramasModule);
} else {
  initVehiculosDiagramasModule();
}

function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp({
          apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOir4GeeHRYY",
          authDomain: "probaktronic-app.firebaseapp.com",
          projectId: "probaktronic-app",
          storageBucket: "probaktronic-app.firebasestorage.app",
          messagingSenderId: "373953615206",
          appId: "1:373953615206:web:6ccca21cefcb6100ee4a7"
        });
      }
    } catch (e) {
      console.warn('Firebase init:', e);
    }
  }
}

function ensureFirebaseSDKReady(callback) {
  if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
    ensureFirebaseInitialized();
    if (callback) callback();
    return;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
      clearInterval(interval);
      ensureFirebaseInitialized();
      if (callback) callback();
      return;
    }
    if (attempts > 20) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 100);

  // Inject scripts if not present
  if (!document.querySelector('script[src*="firebase-app-compat"]')) {
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    s1.onload = () => {
      if (!document.querySelector('script[src*="firebase-firestore-compat"]')) {
        const s2 = document.createElement('script');
        s2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
        document.head.appendChild(s2);
      }
    };
    document.head.appendChild(s1);
  }
}

function safeCreateCenteredLoader(container, text) {
  if (typeof window.createCenteredFirebaseLoader === 'function') {
    return window.createCenteredFirebaseLoader(container, text);
  }
  return { finish: (cb) => { if (cb) cb(); } };
}

const defaultDiagramBrands = [
  { id: 'hyundai', name: 'Hyundai', logo: getBrandLogoUrl('hyundai') },
  { id: 'toyota', name: 'Toyota', logo: getBrandLogoUrl('toyota') }
];

let cachedActiveBrands = defaultDiagramBrands;

function loadFirestoreDiagramasBrands(grid) {
  if (!grid) {
    grid = document.getElementById('vehiculosBrandGrid');
    if (!grid) return;
  }

  // Render registered brands immediately
  renderOnlyActiveBrands(grid, null, cachedActiveBrands || defaultDiagramBrands);

  ensureFirebaseSDKReady(() => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      return;
    }

    const db = firebase.firestore();
    db.collection('diagramas').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const firestoreBrands = [];
          snapshot.forEach(doc => {
            const docId = doc.id.toLowerCase().trim();
            const data = doc.data() || {};
            const brandName = (data.nombre || data.marca || docId).trim();
            const displayName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
            const logoSrc = data.logo || data.imagen || getBrandLogoUrl(docId);
            firestoreBrands.push({
              id: docId,
              name: displayName,
              logo: logoSrc,
              data: data
            });
          });

          if (firestoreBrands.length > 0) {
            cachedActiveBrands = firestoreBrands;
            renderOnlyActiveBrands(grid, null, firestoreBrands);
          }
        }
      })
      .catch(err => {
        console.warn('Live Firestore diagrams fetch sync:', err);
      });
  });
}

function renderOnlyActiveBrands(grid, loader, brandList) {
  const doRender = () => {
    if (!grid) grid = document.getElementById('vehiculosBrandGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const list = (brandList && brandList.length > 0) ? brandList : defaultDiagramBrands;

    list.forEach(b => {
      const docId = b.id;
      const displayName = b.name;
      const logoSrc = b.logo || getBrandLogoUrl(docId);

      const card = document.createElement('div');
      card.className = 'brand-card position-relative';
      card.setAttribute('data-brand', displayName);
      card.setAttribute('data-doc-id', docId);

      card.innerHTML = `
        <img src="${logoSrc}" alt="${displayName}" class="brand-logo-img" style="max-height: 56px; max-width: 120px; width: auto; height: auto; object-fit: contain; margin-bottom: 12px; display: block;" onerror="this.src='logo_probaktronic_solo.png'">
        <h4 class="brand-name-title">${displayName}</h4>
      `;

      card.onclick = (e) => {
        if (e) e.stopPropagation();
        console.log(`Brand card clicked: [${docId}] - ${displayName}`);
        window.openBrandDiagramModels(docId, displayName, logoSrc, 'diagramas');
      };

      grid.appendChild(card);
    });
  };

  if (loader && typeof loader.finish === 'function') {
    loader.finish(doRender);
  } else {
    doRender();
  }
}

// Open Models for Selected Brand
window.openBrandDiagramModels = function(brandDocId, brandName, logoSrc, collectionName = 'diagramas') {
  currentSelectedBrandId = brandDocId;
  currentSelectedBrandName = brandName;
  window.currentModelsDataStore = {};

  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');
  const modelsListGrid = document.getElementById('modelsListGrid');
  const brandLogo = document.getElementById('selectedBrandLogo');
  const brandTitle = document.getElementById('selectedBrandTitle');

  if (brandsView) brandsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
  if (modelsView) modelsView.classList.remove('d-none');

  if (brandLogo) brandLogo.src = logoSrc || 'logo_probaktronic_solo.png';
  if (brandTitle) brandTitle.textContent = `${brandName} - Diagramas de Vehículos`;
  const mSearch = document.getElementById('modelSearchInput');
  if (mSearch) mSearch.value = '';
  const mClear = document.getElementById('clearModelSearchBtn');
  if (mClear) mClear.classList.add('d-none');
  const noRes = document.getElementById('noModelSearchResults');
  if (noRes) noRes.style.display = 'none';

  if (modelsListGrid) {
    const loader = safeCreateCenteredLoader(modelsListGrid, `Conectando con Cloud Firestore para descargar diagramas de ${brandName}...`);

    if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
      return;
    }

    const db = firebase.firestore();
    db.collection(collectionName).doc(brandDocId).collection('modelos').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          renderModelCardsFromSnapshot(snapshot, brandName, modelsListGrid, loader);
        } else {
          console.log(`Subcollection [diagramas/${brandDocId}/modelos] empty, trying [bobinas/${brandDocId}/modelos]...`);
          db.collection('bobinas').doc(brandDocId).collection('modelos').get().then(bobinasSnap => {
            if (!bobinasSnap.empty) {
              renderModelCardsFromSnapshot(bobinasSnap, brandName, modelsListGrid, loader);
            } else {
              renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
            }
          }).catch(() => renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader));
        }
      })
      .catch(err => {
        console.warn('Error querying modelos:', err);
        renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
      });
  }
};

function getFuelTypeInfo(data, modelName, motor) {
  if (!data) data = {};
  const raw = String(data.combustible || data.tipo_combustible || data.tipo || data.fuel || data.motor_tipo || '').toLowerCase().trim();
  
  if (raw.includes('diesel') || raw.includes('diésel') || raw.includes('petroleo') || raw.includes('petróleo') || raw === 'd') {
    return { name: 'DIÉSEL', isDiesel: true, cssClass: 'badge-diesel' };
  }
  if (raw.includes('gasolina') || raw.includes('nafta') || raw.includes('bencina') || raw.includes('gasoline') || raw === 'g') {
    return { name: 'GASOLINA', isDiesel: false, cssClass: 'badge-gasolina' };
  }

  const combined = ((modelName || '') + ' ' + (motor || '') + ' ' + (data.modelo || '') + ' ' + (data.nombre || '') + ' ' + (data.id || '')).toLowerCase();
  const isDiesel = /\b(diesel|diésel|d-4d|d4d|crdi|tdi|hdi|dci|tdci|cdti|jtd|multijet|1kd|2kd|1gd|2gd)\b/i.test(combined);
  if (isDiesel) {
    return { name: 'DIÉSEL', isDiesel: true, cssClass: 'badge-diesel' };
  }

  return { name: 'GASOLINA', isDiesel: false, cssClass: 'badge-gasolina' };
}

async function renderModelCardsFromSnapshot(snapshot, brandName, modelsListGrid, loader) {
  const brandId = (currentSelectedBrandId || brandName || 'toyota').toLowerCase();
  const db = (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') ? firebase.firestore() : null;

  const modelEntries = [];
  snapshot.forEach(doc => {
    const data = doc.data() || {};
    const docId = doc.id;
    window.currentModelsDataStore[docId] = data;
    modelEntries.push({ docId, data });
  });

  if (db) {
    await Promise.all(modelEntries.map(async (entry) => {
      if (!entry.data.combustible) {
        try {
          const aniosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(entry.docId).collection('anios').get();
          if (!aniosSnap.empty) {
            for (const anioDoc of aniosSnap.docs) {
              const motoresSnap = await anioDoc.ref.collection('motores').get();
              if (!motoresSnap.empty) {
                for (const motorDoc of motoresSnap.docs) {
                  const mData = motorDoc.data() || {};
                  if (mData.combustible) {
                    entry.data.combustible = mData.combustible;
                    return;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Subcollection fuel resolution:', err);
        }
      }
    }));
  }

  loader.finish(() => {
    modelsListGrid.innerHTML = '';

    // Filter model entries by selected fuel type (Diesel vs Gasolina) if active
    let filteredEntries = modelEntries;
    if (currentSelectedFuelType) {
      filteredEntries = modelEntries.filter(({ docId, data }) => {
        const modelName = data.modelo || data.nombre || docId;
        const motor = data.motor || 'Estándar';
        const fuelInfo = getFuelTypeInfo(data, modelName, motor);
        if (currentSelectedFuelType === 'diesel') {
          return fuelInfo.isDiesel;
        } else if (currentSelectedFuelType === 'gasolina') {
          return !fuelInfo.isDiesel;
        }
        return true;
      });
    }

    if (filteredEntries.length === 0) {
      modelsListGrid.innerHTML = `
        <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
          <div style="color: #DC2626; font-size: 2.5rem; margin-bottom: 10px;"><i class="bi bi-info-circle"></i></div>
          <h5 class="fw-bold text-dark">No hay modelos de ${currentSelectedFuelType ? currentSelectedFuelType.toUpperCase() : ''} disponibles</h5>
          <p class="text-muted small">No se encontraron modelos registrados en esta categoría para ${brandName}.</p>
        </div>
      `;
      return;
    }

    filteredEntries.forEach(({ docId, data }) => {
      const modelName = data.modelo || data.nombre || docId;
      const motor = data.motor || 'Estándar';
      const fuelInfo = getFuelTypeInfo(data, modelName, motor);

      const carPhotoUrl = getVehicleCarPhotoUrl(brandName, modelName, docId);
      const thumbHtml = carPhotoUrl ? `
        <div class="model-car-thumb-wrap">
          <img src="${carPhotoUrl}" alt="${modelName}" class="model-car-thumb-img" onerror="this.parentElement.innerHTML='<div class=\\\'model-car-thumb-placeholder\\\'><i class=\\\'bi bi-question-lg\\\'></i></div>'">
        </div>
      ` : `
        <div class="model-car-thumb-wrap">
          <div class="model-car-thumb-placeholder"><i class="bi bi-question-lg"></i></div>
        </div>
      `;

      const card = document.createElement('div');
      card.className = 'model-item-card';
      card.innerHTML = `
        <div class="model-card-header">
          ${thumbHtml}
          <div class="model-card-info">
            <span class="model-card-badge ${fuelInfo.cssClass}">${fuelInfo.name}</span>
            <h4 class="model-card-title" title="${docId}">${docId}</h4>
            <p class="model-card-subtitle" title="${modelName}">${modelName}</p>
          </div>
        </div>
        <div class="model-card-footer">
          <span class="model-card-motor">Motor / Parte: <strong>${motor}</strong></span>
          <i class="bi bi-chevron-right"></i>
        </div>
      `;

      card.onclick = () => openModelEcuInfo(docId, modelName, motor);
      modelsListGrid.appendChild(card);
    });

    setupModelSearchFilter();
  });
}

function renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader) {
  const defaultModelsMap = {
    'hyundai': [{ id: 'accent', modelo: 'Hyundai Accent 2020', motor: '1.6 Gamma', combustible: 'gasolina' }],
    'toyota': [
      { id: 'hilux', modelo: 'TOYOTA HILUX 2011 - 2015', motor: '2KD-FTV (2011 - 2015)', combustible: 'diesel' },
      { id: 'Corolla', modelo: 'Toyota corollla 4E FE - 1991 - 2002', motor: '4E-FE 1.3L', combustible: 'gasolina' }
    ],
    'audi': [
      { id: 'Audi A3', modelo: 'Audi A3 (8P VR6 3.2L)', motor: '022905100B', combustible: 'gasolina' },
      { id: 'Audi A4', modelo: 'Audi A4 2.0 TFSI', motor: '06H 905 115', combustible: 'gasolina' },
      { id: 'Audi Q7', modelo: 'Audi Q7 3.0 TDI', motor: 'V6 Quattro TDI', combustible: 'diesel' },
      { id: 'Audi TT', modelo: 'Audi TT Coupe 1.8T', motor: '06B 905 115', combustible: 'gasolina' }
    ],
    'bmw': [{ id: 'BMW 118i', modelo: 'BMW 118i (E87 / F20)', motor: '12137575010', combustible: 'gasolina' }],
    'chevrolet': [
      { id: 'Captiva', modelo: 'Chevrolet Captiva 2.4L', motor: '12638824', combustible: 'gasolina' },
      { id: 'Sail', modelo: 'Chevrolet Sail 1.4L', motor: 'Módulo DIS 4-Salidas', combustible: 'gasolina' }
    ],
    'citroen': [
      { id: 'Berlingo', modelo: 'Citroën Berlingo 1.6 VTi', motor: 'Regleta 4-Pines', combustible: 'gasolina' },
      { id: 'Cactus', modelo: 'Citroën C4 Cactus', motor: 'PureTech 110', combustible: 'gasolina' }
    ],
    'dacia': [{ id: 'Duster', modelo: 'Dacia Duster 1.6L / 2.0L', motor: 'Renault K4M', combustible: 'gasolina' }],
    'daihatsu': [{ id: 'Terios', modelo: 'Daihatsu Terios 1.3L', motor: 'K3-VE / 3SZ-VE', combustible: 'gasolina' }],
    'fiat': [{ id: 'Doblo', modelo: 'Fiat Doblò 1.4 Fire', motor: 'Fire 8V / 16V', combustible: 'gasolina' }]
  };

  let list = defaultModelsMap[brandDocId.toLowerCase()] || [{ id: `${brandName} Model 1`, modelo: `${brandName} Estándar`, motor: 'ECU 1.6L', combustible: 'gasolina' }];

  if (currentSelectedFuelType) {
    list = list.filter(m => {
      const fuelInfo = getFuelTypeInfo(m, m.modelo, m.motor);
      if (currentSelectedFuelType === 'diesel') return fuelInfo.isDiesel;
      if (currentSelectedFuelType === 'gasolina') return !fuelInfo.isDiesel;
      return true;
    });
  }

  loader.finish(() => {
    modelsListGrid.innerHTML = '';
    list.forEach(m => {
      window.currentModelsDataStore[m.id] = m;
      const fuelInfo = getFuelTypeInfo(m, m.modelo, m.motor);
      const carPhotoUrl = getVehicleCarPhotoUrl(brandName, m.modelo, m.id);
      const thumbHtml = carPhotoUrl ? `
        <div class="model-car-thumb-wrap">
          <img src="${carPhotoUrl}" alt="${m.modelo}" class="model-car-thumb-img" onerror="this.parentElement.innerHTML='<div class=\\\'model-car-thumb-placeholder\\\'><i class=\\\'bi bi-question-lg\\\'></i></div>'">
        </div>
      ` : `
        <div class="model-car-thumb-wrap">
          <div class="model-car-thumb-placeholder"><i class="bi bi-question-lg"></i></div>
        </div>
      `;

      const card = document.createElement('div');
      card.className = 'model-item-card';
      card.innerHTML = `
        <div class="model-card-header">
          ${thumbHtml}
          <div class="model-card-info">
            <span class="model-card-badge ${fuelInfo.cssClass}">${fuelInfo.name}</span>
            <h4 class="model-card-title" title="${m.id}">${m.id}</h4>
            <p class="model-card-subtitle" title="${m.modelo}">${m.modelo}</p>
          </div>
        </div>
        <div class="model-card-footer">
          <span class="model-card-motor">Motor / Parte: <strong>${m.motor}</strong></span>
          <i class="bi bi-chevron-right"></i>
        </div>
      `;

      card.onclick = () => openModelEcuInfo(m.id, m.modelo, m.motor);
      modelsListGrid.appendChild(card);
    });

    setupModelSearchFilter();
  });
}

// Open Level 3: ECU Info & Connection Type Selector (Reference Design Flow)
window.openModelEcuInfo = async function(docId, modelName, motorCode) {
  const brandId = currentSelectedBrandId || 'toyota';
  const brandName = currentSelectedBrandName || 'TOYOTA';

  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
  if (ecuView) ecuView.classList.remove('d-none');

  // Populate Selected Vehicle Segmented Bar
  const logoEl = document.getElementById('selectedVehicleBrandLogo');
  const brandTextEl = document.getElementById('selectedVehicleBrandText');
  const modelTextEl = document.getElementById('selectedVehicleModelText');
  const specTextEl = document.getElementById('selectedVehicleSpecText');
  const ecuTitleEl = document.getElementById('ecuNameTitle');
  const ecuManufacturerEl = document.getElementById('ecuManufacturerLogo');
  const connectionListContainer = document.getElementById('connectionTypeListContainer');

  if (logoEl) logoEl.src = getBrandLogoUrl(brandId);
  if (brandTextEl) brandTextEl.textContent = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase();
  if (modelTextEl) modelTextEl.textContent = modelName || docId;
  if (specTextEl) specTextEl.textContent = motorCode || '1.5L 109ps (1NZFE)';

  // Determine ECU part code and ECU manufacturer
  const cleanBrand = brandId.toLowerCase();
  let manufacturerName = 'DENSO';
  if (cleanBrand.includes('audi') || cleanBrand.includes('bmw') || cleanBrand.includes('volkswagen') || cleanBrand.includes('vw') || cleanBrand.includes('mercedes') || cleanBrand.includes('porsche') || cleanBrand.includes('seat') || cleanBrand.includes('skoda')) {
    manufacturerName = 'BOSCH';
  } else if (cleanBrand.includes('chevrolet') || cleanBrand.includes('gmc') || cleanBrand.includes('hyundai') || cleanBrand.includes('kia')) {
    manufacturerName = 'DELPHI';
  } else if (cleanBrand.includes('ford') || cleanBrand.includes('peugeot') || cleanBrand.includes('citroen') || cleanBrand.includes('renault')) {
    manufacturerName = 'CONTINENTAL';
  } else if (cleanBrand.includes('fiat') || cleanBrand.includes('lancia') || cleanBrand.includes('alfa')) {
    manufacturerName = 'MAGNETI MARELLI';
  } else if (cleanBrand.includes('toyota') || cleanBrand.includes('daihatsu') || cleanBrand.includes('subaru') || cleanBrand.includes('suzuki')) {
    manufacturerName = 'DENSO';
  }

  if (ecuManufacturerEl) ecuManufacturerEl.textContent = manufacturerName;
  if (ecuTitleEl) ecuTitleEl.textContent = (motorCode && motorCode !== 'Estándar') ? motorCode : '275036-1152';

  if (!connectionListContainer) return;

  const loader = safeCreateCenteredLoader(connectionListContainer, 'Cargando opciones de conexión desde Firebase...');

  // Query subcollection 'archivos' from Firestore
  let archivosList = [];
  try {
    const db = firebase.firestore();
    const aniosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').get();
    
    if (!aniosSnap.empty) {
      for (const anioDoc of aniosSnap.docs) {
        const motoresSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').get();
        if (!motoresSnap.empty) {
          for (const motorDoc of motoresSnap.docs) {
            const archivosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').doc(motorDoc.id).collection('archivos').get();
            if (!archivosSnap.empty) {
              archivosSnap.forEach(aDoc => {
                archivosList.push({ id: aDoc.id, ...aDoc.data() });
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error querying archivos subcollection:', e);
  }

  // Fallback connection modes (OBD, BOOT, BENCH, PEDAL, etc.) if none in Firestore
  if (archivosList.length === 0) {
    archivosList = [
      { id: 'OBD', titulo: 'OBD', tipo: 'DIAGRAMA OBD' },
      { id: 'BOOT', titulo: 'BOOT', tipo: 'CONEXIÓN BOOT' },
      { id: 'BENCH', titulo: 'BENCH', tipo: 'MODO BANCO' },
      { id: 'PEDAL', titulo: 'PEDAL', tipo: 'DOCUMENTO PDF' },
      { id: 'EDU 2 CONECTORES', titulo: 'EDU 2 CONECTORES', tipo: 'DOCUMENTO PDF' },
      { id: 'INMOVILIZADOR', titulo: 'INMOVILIZADOR', tipo: 'DOCUMENTO PDF' }
    ];
  }

  let selectedArchDoc = archivosList[0];

  loader.finish(() => {
    connectionListContainer.innerHTML = '';

    archivosList.forEach((arch, index) => {
      const isSelected = index === 0;
      const title = (arch.titulo || arch.nombre || arch.id).toUpperCase();
      const cardKey = arch.id || title;

      // Check if Admin set a custom icon for this card key
      let customIcon = arch.icono;
      try {
        const savedCustomIcons = JSON.parse(localStorage.getItem('probaktronic_card_icons') || '{}');
        if (savedCustomIcons[cardKey]) {
          customIcon = savedCustomIcons[cardKey];
        }
      } catch (e) {}

      let iconHtml = '<i class="bi bi-cpu-fill fs-1"></i>';
      if (customIcon) {
        if (customIcon.startsWith('bi-')) {
          iconHtml = `<i class="bi ${customIcon} fs-1"></i>`;
        } else if (customIcon.startsWith('http') || customIcon.includes('/') || customIcon.endsWith('.svg') || customIcon.endsWith('.png')) {
          iconHtml = `<img src="${customIcon}" alt="Icono" style="max-height: 48px; object-fit: contain;">`;
        }
      } else if (title.includes('OBD')) {
        iconHtml = '<i class="bi bi-hdd-network-fill fs-1"></i>';
      } else if (title.includes('BOOT')) {
        iconHtml = '<i class="bi bi-cpu-fill fs-1"></i>';
      } else if (title.includes('BENCH')) {
        iconHtml = '<i class="bi bi-motherboard-fill fs-1"></i>';
      } else if (title.includes('PEDAL')) {
        iconHtml = '<i class="bi bi-sliders2 fs-1" title="Pedal Acelerador APP"></i>';
      } else if (title.includes('EDU') || title.includes('CONECTOR')) {
        iconHtml = '<i class="bi bi-diagram-3-fill fs-1"></i>';
      } else if (title.includes('INMOVILIZADOR') || title.includes('LLAVE')) {
        iconHtml = '<i class="bi bi-key-fill fs-1"></i>';
      } else if (title.includes('PDF') || title.includes('DOCUMENTO')) {
        iconHtml = '<i class="bi bi-file-earmark-pdf-fill fs-1"></i>';
      }

      const isAdmin = (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email === 'prueba@probak.com');
      const adminEditBtnHtml = isAdmin ? `
        <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-1 rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px; z-index: 15;" title="Cambiar ícono de esta tarjeta como Administrador" onclick="openAdminMechanicalIconPicker(event, '${cardKey}')">
          <i class="bi bi-pencil-fill text-danger" style="font-size: 10px;"></i>
        </button>
      ` : '';

      const card = document.createElement('div');
      card.className = `connection-type-card position-relative ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        ${adminEditBtnHtml}
        <div class="card-corner-badge">
          <i class="bi ${isSelected ? 'bi-check-circle-fill' : 'bi-slash-circle'}"></i>
        </div>
        <div class="conn-icon">
          ${iconHtml}
        </div>
        <div class="conn-label">${title}</div>
      `;

      card.onclick = () => {
        connectionListContainer.querySelectorAll('.connection-type-card').forEach(c => {
          c.classList.remove('active');
          const badge = c.querySelector('.card-corner-badge i');
          if (badge) badge.className = 'bi bi-slash-circle';
        });

        card.classList.add('active');
        const badge = card.querySelector('.card-corner-badge i');
        if (badge) badge.className = 'bi bi-check-circle-fill';

        selectedArchDoc = arch;
      };

      connectionListContainer.appendChild(card);
    });
  });

  // Attach NEXT button handler
  const btnNext = document.getElementById('btnNextToDiagram');
  if (btnNext) {
    btnNext.onclick = () => {
      openDiagramViewer(docId, selectedArchDoc);
    };
  }
};

// Global Console Controls for Level 4 Diagnostic Viewer
let currentConsoleZoom = 1.0;
window._currentActiveDiagramData = {};

function extractDynamicComponentName(rawTitle) {
  if (!rawTitle) return { name: 'Componente', phrase: 'del Componente' };
  const clean = rawTitle.toUpperCase();
  if (clean.includes('PEDAL')) return { name: 'Pedal', phrase: 'del Pedal' };
  if (clean.includes('ECU') || clean.includes('COMPUTADORA')) return { name: 'la ECU', phrase: 'de la ECU' };
  if (clean.includes('ANTENA') || clean.includes('INMOVILIZADOR') || clean.includes('LLAVE')) return { name: 'la Antena / Inmovilizador', phrase: 'de la Antena / Inmovilizador' };
  if (clean.includes('EDU') || clean.includes('E.D.U')) {
    if (clean.includes('DOS') || clean.includes('2')) return { name: 'la EDU (2 Conectores)', phrase: 'de la EDU (2 Conectores)' };
    if (clean.includes('TRES') || clean.includes('3')) return { name: 'la EDU (3 Conectores)', phrase: 'de la EDU (3 Conectores)' };
    return { name: 'la EDU', phrase: 'de la EDU' };
  }
  if (clean.includes('OBD')) return { name: 'el Puerto OBD', phrase: 'del Puerto OBD' };
  if (clean.includes('BOOT')) return { name: 'el Modo Boot', phrase: 'del Modo Boot' };
  if (clean.includes('BENCH')) return { name: 'el Modo Banco', phrase: 'del Modo Banco' };
  if (clean.includes('BOBINA')) return { name: 'la Bobina', phrase: 'de la Bobina' };
  if (clean.includes('SENSOR') || clean.includes('ACTUADOR')) return { name: 'el Sensor', phrase: 'del Sensor / Actuador' };
  
  return { name: rawTitle, phrase: `de ${rawTitle}` };
}

let currentPdfDoc = null;
let currentPdfPageNum = 1;
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentZoomLevels = [1.0, 1.75, 2.5];
let currentZoomLevelIndex = 0;

window.applyConsoleWatermark = function(isVertical = true) {
  const overlay = document.getElementById('consoleWatermarkOverlay');
  if (overlay) {
    overlay.style.backgroundImage = isVertical ? "url('ic_fondo_vertical.png')" : "url('ic_fondo_horizontal.png')";
  }
};

window.renderPdfPageOnCanvas = function(pageNum) {
  if (!currentPdfDoc) return;
  const canvas = document.getElementById('consolePdfCanvas');
  const wrap = document.getElementById('consoleImgViewerWrap');
  if (!canvas || !wrap) return;

  currentPdfDoc.getPage(pageNum).then(page => {
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const wrapWidth = wrap.clientWidth ? Math.min(wrap.clientWidth - 24, 1300) : 1100;
    const fitScale = wrapWidth / unscaledViewport.width;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: fitScale * dpr });

    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Display scale in CSS to keep exact physical crispness and fill container
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '78vh';

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    page.render(renderContext).promise.then(() => {
      console.log(`PDF Page ${pageNum} rendered with Ultra-HD crispness.`);
      const pageInfo = document.getElementById('pdfPageInfo');
      if (pageInfo) {
        pageInfo.textContent = `Página ${pageNum} / ${currentPdfDoc.numPages}`;
      }
      const isVert = (viewport.height / viewport.width) > 1.15;
      window.applyConsoleWatermark(isVert);
    });
  });
};

window.changePdfPage = function(delta) {
  if (!currentPdfDoc) return;
  const newPage = currentPdfPageNum + delta;
  if (newPage >= 1 && newPage <= currentPdfDoc.numPages) {
    currentPdfPageNum = newPage;
    window.renderPdfPageOnCanvas(currentPdfPageNum);
  }
};

window.renderGalleryPagination = function(imagesList) {
  const paginationEl = document.getElementById('consoleGalleryPagination');
  const prevBtn = document.getElementById('btnPrevGalleryImg');
  const nextBtn = document.getElementById('btnNextGalleryImg');

  if (!paginationEl) return;

  currentGalleryImages = imagesList || [];
  currentGalleryIndex = 0;

  if (currentGalleryImages.length > 1) {
    paginationEl.classList.remove('d-none');
    if (prevBtn) prevBtn.classList.remove('d-none');
    if (nextBtn) nextBtn.classList.remove('d-none');

    paginationEl.innerHTML = currentGalleryImages.map((_, idx) => `
      <button class="btn-photo-pill ${idx === 0 ? 'active' : ''}" onclick="showGalleryImageAtIndex(${idx})">
        <i class="bi bi-image me-1"></i> Foto ${idx + 1}
      </button>
    `).join('');
  } else {
    paginationEl.classList.add('d-none');
    if (prevBtn) prevBtn.classList.add('d-none');
    if (nextBtn) nextBtn.classList.add('d-none');
  }
};

window.showGalleryImageAtIndex = function(index) {
  if (!currentGalleryImages || currentGalleryImages.length === 0) return;
  if (index < 0) index = currentGalleryImages.length - 1;
  if (index >= currentGalleryImages.length) index = 0;

  currentGalleryIndex = index;
  const imgEl = document.getElementById('consoleMainDiagramImg');
  if (imgEl) {
    imgEl.onload = () => {
      const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
      window.applyConsoleWatermark(isVert);
    };
    imgEl.src = currentGalleryImages[currentGalleryIndex];
    if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.width > 0)) {
      const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
      window.applyConsoleWatermark(isVert);
    }
  }

  const pills = document.querySelectorAll('.btn-photo-pill');
  pills.forEach((p, i) => {
    if (i === currentGalleryIndex) p.classList.add('active');
    else p.classList.remove('active');
  });
};

window.navigateGalleryImage = function(delta) {
  window.showGalleryImageAtIndex(currentGalleryIndex + delta);
};

let currentPanX = 0;
let currentPanY = 0;

window.updateStageTransform = function(animate = true) {
  const stageEl = document.getElementById('consoleDiagramStage');
  if (!stageEl) return;
  stageEl.style.transition = animate ? 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
  stageEl.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentConsoleZoom})`;
};

window.toggleHandZoom = function() {
  currentZoomLevelIndex = (currentZoomLevelIndex + 1) % currentZoomLevels.length;
  currentConsoleZoom = currentZoomLevels[currentZoomLevelIndex];

  const zoomText = document.getElementById('zoomModeText');
  if (zoomText) {
    zoomText.textContent = `ZOOM (${currentConsoleZoom.toFixed(1)}x)`;
  }

  if (currentConsoleZoom === 1.0) {
    currentPanX = 0;
    currentPanY = 0;
  }

  window.updateStageTransform(true);
};

window.showConsoleSplashView = function() {
  const splash = document.getElementById('consoleSplashView');
  const content = document.getElementById('consoleDiagramContent');
  if (splash) splash.classList.remove('d-none');
  if (content) content.classList.add('d-none');
};

window.loadSpecificDiagramSection = async function(type) {
  const splash = document.getElementById('consoleSplashView');
  const content = document.getElementById('consoleDiagramContent');
  const titleEl = document.getElementById('consoleActiveDocTitle');
  const imgEl = document.getElementById('consoleMainDiagramImg');
  const frameEl = document.getElementById('consolePdfFrame');
  const canvasEl = document.getElementById('consolePdfCanvas');
  const pdfPaginationEl = document.getElementById('consolePdfPagination');
  const galleryPaginationEl = document.getElementById('consoleGalleryPagination');
  const prevGalleryBtn = document.getElementById('btnPrevGalleryImg');
  const nextGalleryBtn = document.getElementById('btnNextGalleryImg');
  const btnPcb = document.getElementById('btnPcbManual');
  const btnConn = document.getElementById('btnConnectorManual');

  if (splash) splash.classList.add('d-none');
  if (content) content.classList.remove('d-none');

  const comp = window._currentActiveDiagramData ? window._currentActiveDiagramData._componentMeta : { phrase: 'del Componente' };
  const active = window._currentActiveDiagramData || {};

  // Setup Drag & Pan Hand Cursor on the Viewer Canvas
  setupViewerDragPan();

  if (type === 'pcb') {
    // 1. Imagen del Componente (Shows multiple photos if available, e.g. 4 photos of pedal)
    if (btnPcb) btnPcb.classList.add('active');
    if (btnConn) btnConn.classList.remove('active');
    if (titleEl) titleEl.textContent = `Imagen ${comp.phrase}`;

    if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
    if (canvasEl) canvasEl.classList.add('d-none');
    if (frameEl) {
      frameEl.classList.add('d-none');
      frameEl.src = '';
    }

    if (imgEl) {
      imgEl.classList.remove('d-none');

      // Aggregate all photos for this component
      let photos = [];
      if (Array.isArray(active.allImages) && active.allImages.length > 0) {
        photos = [...active.allImages];
      } else if (Array.isArray(active.imagenes) && active.imagenes.length > 0) {
        photos = [...active.imagenes];
      } else if (Array.isArray(active.fotos) && active.fotos.length > 0) {
        photos = [...active.fotos];
      }

      // If single or none, extract and prepare gallery (e.g. 4 photos for pedal)
      if (photos.length === 0) {
        const single = active.fotoComponente || active.imageUrl || active.imagen || active.image || 'imagenes autos/ic_car_toyota_yaris.JPG';
        photos = [single];
      }

      // If viewing Pedal, ensure up to 4 photos are browsable
      if (photos.length === 1 && (comp.phrase.includes('Pedal') || comp.phrase.includes('PEDAL'))) {
        photos = [
          photos[0],
          'imagenes autos/ic_car_toyota_yaris.JPG',
          'imagenes autos/ic_car_toyota_hilux.JPG',
          'imagenes autos/ic_car_toyota_corolla.JPG'
        ].filter((v, i, a) => a.indexOf(v) === i || i < 4);
      }

      window.renderGalleryPagination(photos);
      window.showGalleryImageAtIndex(0);
    }
  } else {
    // 2. Conexionado del componente (PDF or Schematic Diagram)
    if (btnPcb) btnPcb.classList.remove('active');
    if (btnConn) btnConn.classList.add('active');
    if (titleEl) titleEl.textContent = `Conexionado ${comp.phrase}`;

    if (galleryPaginationEl) galleryPaginationEl.classList.add('d-none');
    if (prevGalleryBtn) prevGalleryBtn.classList.add('d-none');
    if (nextGalleryBtn) nextGalleryBtn.classList.add('d-none');

    let targetPdfOrImg = active.url || active.archivoUrl || active.pdfUrl || active.downloadUrl || active.imageUrl || active.imagen;

    // Resolve gs:// storage URLs if necessary
    if (typeof targetPdfOrImg === 'string' && targetPdfOrImg.startsWith('gs://')) {
      try {
        if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
          const storage = firebase.storage();
          const ref = storage.refFromURL(targetPdfOrImg);
          targetPdfOrImg = await ref.getDownloadURL();
        }
      } catch (err) {
        console.warn('Storage URL resolve error:', err);
      }
    }

    if (!targetPdfOrImg || targetPdfOrImg.includes('logo_probaktronic')) {
      targetPdfOrImg = 'imagenes autos/ic_car_toyota_yaris.JPG';
    }

    const isPdf = typeof targetPdfOrImg === 'string' && (
      targetPdfOrImg.toLowerCase().includes('.pdf') || 
      targetPdfOrImg.includes('firebasestorage.googleapis.com') || 
      targetPdfOrImg.includes('firebase')
    );

    window.currentActivePdfUrl = targetPdfOrImg;

    if (isPdf) {
      if (imgEl) imgEl.classList.add('d-none');

      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

        pdfjsLib.getDocument({ url: targetPdfOrImg, withCredentials: false }).promise.then(pdfDoc => {
          currentPdfDoc = pdfDoc;
          currentPdfPageNum = 1;
          if (frameEl) {
            frameEl.classList.add('d-none');
            frameEl.src = '';
          }
          if (canvasEl) canvasEl.classList.remove('d-none');
          if (pdfPaginationEl) {
            if (pdfDoc.numPages > 1) pdfPaginationEl.classList.remove('d-none');
            else pdfPaginationEl.classList.add('d-none');
          }
          window.renderPdfPageOnCanvas(1);
        }).catch(err => {
          console.warn('PDF.js canvas render error, fallback to viewer:', err);
          if (canvasEl) canvasEl.classList.add('d-none');
          if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
          if (frameEl) {
            frameEl.classList.remove('d-none');
            if (isMobileDevice || targetPdfOrImg.includes('firebasestorage.googleapis.com')) {
              frameEl.src = `https://docs.google.com/viewer?url=${encodeURIComponent(targetPdfOrImg)}&embedded=true`;
            } else {
              frameEl.src = `${targetPdfOrImg}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
            }
          }
        });
      } else {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (canvasEl) canvasEl.classList.add('d-none');
        if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
        if (frameEl) {
          frameEl.classList.remove('d-none');
          if (isMobileDevice || targetPdfOrImg.includes('firebasestorage.googleapis.com')) {
            frameEl.src = `https://docs.google.com/viewer?url=${encodeURIComponent(targetPdfOrImg)}&embedded=true`;
          } else {
            frameEl.src = `${targetPdfOrImg}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
          }
        }
      }
      // Set horizontal watermark for PDFs
      window.applyConsoleWatermark(false);
    } else {
      if (frameEl) {
        frameEl.classList.add('d-none');
        frameEl.src = '';
      }
      if (canvasEl) canvasEl.classList.add('d-none');
      if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
      if (imgEl) {
        imgEl.classList.remove('d-none');
        imgEl.onload = () => {
          const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
          window.applyConsoleWatermark(isVert);
        };
        imgEl.src = targetPdfOrImg;
        if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.width > 0)) {
          const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
          window.applyConsoleWatermark(isVert);
        }
      }
    }
  }

  window.currentActiveDiagramSection = type;

  const toggleMediaBtnText = document.getElementById('toggleMediaViewText');
  const toggleMediaIcon = document.getElementById('toggleMediaIcon');
  if (toggleMediaBtnText) {
    if (type === 'pcb') {
      toggleMediaBtnText.textContent = `Ver Conexionado`;
      if (toggleMediaIcon) toggleMediaIcon.className = 'bi bi-diagram-3 text-danger fs-6';
    } else {
      toggleMediaBtnText.textContent = `Imágenes ${comp.phrase}`;
      if (toggleMediaIcon) toggleMediaIcon.className = 'bi bi-images text-danger fs-6';
    }
  }

  window.resetConsoleDiagramZoom();
};

window.toggleDiagramMediaView = function() {
  if (window.currentActiveDiagramSection === 'pcb') {
    window.loadSpecificDiagramSection('connector');
  } else {
    window.loadSpecificDiagramSection('pcb');
  }
};

window.printConsoleDiagram = function() {
  const canvasEl = document.getElementById('consolePdfCanvas');
  const imgEl = document.getElementById('consoleMainDiagramImg');

  let isVertical = false;
  if (canvasEl && !canvasEl.classList.contains('d-none')) {
    isVertical = canvasEl.height > canvasEl.width;
  } else if (imgEl && !imgEl.classList.contains('d-none')) {
    isVertical = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
  }

  // Set watermark according to orientation
  window.applyConsoleWatermark(isVertical);

  // Set dynamic @page orientation rule
  let styleEl = document.getElementById('dynamicPrintPageStyle');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicPrintPageStyle';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `@page { size: ${isVertical ? 'portrait' : 'landscape'}; margin: 0mm !important; }`;

  // Temporarily reset zoom to 1.0x so print layout fits the page cleanly in the same tab
  const prevZoom = currentConsoleZoom;
  window.resetConsoleDiagramZoom();

  setTimeout(() => {
    window.print();
    if (prevZoom > 1.0) {
      setTimeout(() => {
        window.toggleHandZoom();
      }, 500);
    }
  }, 100);
};

function setupViewerDragPan() {
  const wrap = document.getElementById('consoleImgViewerWrap');
  if (!wrap || wrap.dataset.panSetup === 'true') return;
  wrap.dataset.panSetup = 'true';

  let isDown = false;
  let startX = 0, startY = 0;
  let initialPanX = 0, initialPanY = 0;
  let hasMoved = false;

  wrap.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('.console-gallery-pagination')) return;
    isDown = true;
    hasMoved = false;
    wrap.classList.add('grabbing');
    startX = e.clientX;
    startY = e.clientY;
    initialPanX = currentPanX;
    initialPanY = currentPanY;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    wrap.classList.remove('grabbing');
    if (hasMoved) {
      window.updateStageTransform(true);
    }
  });

  wrap.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }
    currentPanX = initialPanX + dx;
    currentPanY = initialPanY + dy;
    window.updateStageTransform(false);
  });

  // Touch Support
  wrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDown = true;
      hasMoved = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      initialPanX = currentPanX;
      initialPanY = currentPanY;
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {
    if (!isDown || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }
    currentPanX = initialPanX + dx;
    currentPanY = initialPanY + dy;
    window.updateStageTransform(false);
  }, { passive: true });

  wrap.addEventListener('touchend', () => {
    if (isDown) {
      isDown = false;
      window.updateStageTransform(true);
    }
  });

  // Mouse Wheel Zoom
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.2 : -0.2;
    let newZoom = Math.round((currentConsoleZoom + zoomStep) * 10) / 10;
    if (newZoom < 1.0) {
      newZoom = 1.0;
      currentPanX = 0;
      currentPanY = 0;
    }
    if (newZoom > 3.5) newZoom = 3.5;
    currentConsoleZoom = newZoom;
    const zoomText = document.getElementById('zoomModeText');
    if (zoomText) zoomText.textContent = `ZOOM (${currentConsoleZoom.toFixed(1)}x)`;
    window.updateStageTransform(true);
  }, { passive: false });
}

window.zoomConsoleDiagram = function(factor) {
  let newZoom = Math.round((currentConsoleZoom * factor) * 10) / 10;
  if (newZoom < 1.0) {
    newZoom = 1.0;
    currentPanX = 0;
    currentPanY = 0;
  }
  if (newZoom > 3.5) newZoom = 3.5;
  currentConsoleZoom = newZoom;

  const zoomText = document.getElementById('zoomModeText');
  if (zoomText) {
    zoomText.textContent = `ZOOM (${currentConsoleZoom.toFixed(1)}x)`;
  }

  window.updateStageTransform(true);
};

window.resetConsoleDiagramZoom = function() {
  currentConsoleZoom = 1.0;
  currentZoomLevelIndex = 0;
  currentPanX = 0;
  currentPanY = 0;

  const zoomText = document.getElementById('zoomModeText');
  if (zoomText) {
    zoomText.textContent = `ZOOM (1.0x)`;
  }

  window.updateStageTransform(true);
};

window.toggleConsoleFullscreen = function() {
  const elem = document.getElementById('diagramViewContainer');
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// Open Diagram Viewer for Selected Model (Level 4 High-Tech Console)
window.openDiagramViewer = async function(docId, selectedArchDoc = null) {
  const rawData = window.currentModelsDataStore[docId] || {};
  console.log(`Displaying diagram console for [${docId}]:`, rawData, 'selectedArchDoc:', selectedArchDoc);

  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.remove('d-none');

  // Populate Console Meta Header
  const brandId = (currentSelectedBrandId || 'toyota').toLowerCase();
  let manufacturerName = 'DENSO';
  if (brandId.includes('audi') || brandId.includes('bmw') || brandId.includes('volkswagen') || brandId.includes('vw') || brandId.includes('mercedes') || brandId.includes('porsche') || brandId.includes('seat') || brandId.includes('skoda')) {
    manufacturerName = 'BOSCH';
  } else if (brandId.includes('chevrolet') || brandId.includes('gmc') || brandId.includes('hyundai') || brandId.includes('kia')) {
    manufacturerName = 'DELPHI';
  } else if (brandId.includes('ford') || brandId.includes('peugeot') || brandId.includes('citroen') || brandId.includes('renault')) {
    manufacturerName = 'CONTINENTAL';
  } else if (brandId.includes('fiat') || brandId.includes('lancia') || brandId.includes('alfa')) {
    manufacturerName = 'MAGNETI MARELLI';
  } else if (brandId.includes('toyota') || brandId.includes('daihatsu') || brandId.includes('subaru') || brandId.includes('suzuki')) {
    manufacturerName = 'DENSO';
  }

  const ecuTitle = (rawData.motor && rawData.motor !== 'Estándar') ? rawData.motor : '275036-1152';
  const connTitle = selectedArchDoc ? (selectedArchDoc.titulo || selectedArchDoc.nombre || selectedArchDoc.id || 'PEDAL') : 'PEDAL';

  const mfgEl = document.getElementById('consoleManufacturer');
  const ecuEl = document.getElementById('consoleEcuNumber');
  const modeEl = document.getElementById('consoleWorkingMode');
  const protoEl = document.getElementById('consoleProtocolNumber');

  if (mfgEl) mfgEl.textContent = manufacturerName;
  if (ecuEl) ecuEl.textContent = ecuTitle;
  let cleanModeTitle = connTitle;
  // Clean redundant brand and year prefix if present
  const redundantPrefixRegex = new RegExp(`^(${currentSelectedBrandName || ''}|toyota|hyundai|nissan|chevrolet|audi|kia|ford)\\s*([a-zA-Z0-9_-]+)?\\s*(\\d{4}\\s*-\\s*\\d{4})?\\s*`, 'i');
  const stripped = cleanModeTitle.replace(redundantPrefixRegex, '').trim();
  if (stripped.length >= 3) cleanModeTitle = stripped;
  if (modeEl) modeEl.textContent = cleanModeTitle.toUpperCase();
  if (protoEl) protoEl.textContent = '50110389';

  // Dynamic Button Labels (e.g. "Imagen del Pedal", "Conexionado del Pedal")
  const compMeta = extractDynamicComponentName(connTitle);
  const pcbLabel = document.getElementById('btnPcbManualLabel');
  const connLabel = document.getElementById('btnConnectorManualLabel');

  if (pcbLabel) pcbLabel.textContent = `Imagen ${compMeta.phrase}`;
  if (connLabel) connLabel.textContent = `Conexionado ${compMeta.phrase}`;

  // Deep Hierarchy Traversal & Integration
  let activeData = { ...rawData };

  if (selectedArchDoc) {
    if (selectedArchDoc.titulo || selectedArchDoc.nombre) {
      activeData.tituloArchivo = selectedArchDoc.titulo || selectedArchDoc.nombre;
    }
    if (selectedArchDoc.url || selectedArchDoc.archivoUrl || selectedArchDoc.pdfUrl || selectedArchDoc.downloadUrl) {
      activeData.url = selectedArchDoc.url || selectedArchDoc.archivoUrl || selectedArchDoc.pdfUrl || selectedArchDoc.downloadUrl;
    }
    if (Array.isArray(selectedArchDoc.imagenes) && selectedArchDoc.imagenes.length > 0) {
      activeData.allImages = selectedArchDoc.imagenes;
      activeData.imageUrl = selectedArchDoc.imagenes[0];
    }
    if (selectedArchDoc.imageUrl || selectedArchDoc.imagen) {
      activeData.imageUrl = selectedArchDoc.imageUrl || selectedArchDoc.imagen;
    }
  }

  if (!activeData.imageUrl && !activeData.image && !activeData.imagen && !activeData.url) {
    try {
      const db = firebase.firestore();
      const aniosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').get();
      if (!aniosSnap.empty) {
        for (const anioDoc of aniosSnap.docs) {
          const motoresSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').get();
          if (!motoresSnap.empty) {
            for (const motorDoc of motoresSnap.docs) {
              const archivosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').doc(motorDoc.id).collection('archivos').get();
              if (!archivosSnap.empty) {
                const archivoData = archivosSnap.docs[0].data() || {};
                let extractedUrl = '';
                if (Array.isArray(archivoData.imagenes) && archivoData.imagenes.length > 0) {
                  extractedUrl = archivoData.imagenes[0];
                } else if (typeof archivoData.imageUrl === 'string') {
                  extractedUrl = archivoData.imageUrl;
                } else if (typeof archivoData.url === 'string') {
                  extractedUrl = archivoData.url;
                }
                activeData.imageUrl = extractedUrl;
                break;
              }
            }
          }
          if (activeData.imageUrl) break;
        }
      }
    } catch (e) {
      console.warn('Subcollection deep inspection error:', e);
    }
  }

  activeData._componentMeta = compMeta;
  window._currentActiveDiagramData = activeData;

  // Show the console splash view initially
  window.showConsoleSplashView();
};


let currentSelectedFuelType = ''; // 'gasolina' or 'diesel'
let currentSelectedCategoryKey = ''; // 'pickup', 'furgon', 'camiones', 'maquinaria'

window.showFuelSelectorView = function(e) {
  if (e) e.preventDefault();

  const fuelView = document.getElementById('fuelSelectorViewContainer');
  const dieselCatView = document.getElementById('dieselCategoriesViewContainer');
  const gasCatView = document.getElementById('gasolinaCategoriesViewContainer');
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (fuelView) fuelView.classList.remove('d-none');
  if (dieselCatView) dieselCatView.classList.add('d-none');
  if (gasCatView) gasCatView.classList.add('d-none');
  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');

  updateBreadcrumbUI('fuel');

  const headerTitle = document.getElementById('vehiculosHeaderTitle');
  const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
  if (headerTitle) headerTitle.textContent = 'SELECCIONAR VEHÍCULO';
  if (headerSubtitle) headerSubtitle.textContent = 'Seleccione el tipo de motorización y categoría para consultar los esquemas de diagnóstico';
};

window.selectFuelType = function(fuelType) {
  currentSelectedFuelType = fuelType;

  const fuelView = document.getElementById('fuelSelectorViewContainer');
  const dieselCatView = document.getElementById('dieselCategoriesViewContainer');
  const gasCatView = document.getElementById('gasolinaCategoriesViewContainer');

  if (fuelView) fuelView.classList.add('d-none');

  if (fuelType === 'diesel') {
    if (dieselCatView) dieselCatView.classList.remove('d-none');
    if (gasCatView) gasCatView.classList.add('d-none');
    updateBreadcrumbUI('fuel_type', 'Diesel');
  } else {
    if (gasCatView) gasCatView.classList.remove('d-none');
    if (dieselCatView) dieselCatView.classList.add('d-none');
    updateBreadcrumbUI('fuel_type', 'Gasolina');
  }
};

window.returnFuelTypeView = function(e) {
  if (e) e.preventDefault();
  if (currentSelectedFuelType) {
    selectFuelType(currentSelectedFuelType);
  } else {
    showFuelSelectorView();
  }
};

window.selectVehicleCategory = function(catKey, fuelType, catTitle, count = 1) {
  if (count <= 0) {
    const msg = `La categoría "${catTitle}" no tiene modelos cargados aún. Próximamente disponible.`;
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast(msg);
    } else {
      alert(msg);
    }
    return;
  }

  currentSelectedCategoryKey = catKey;
  currentSelectedFuelType = fuelType;

  const fuelView = document.getElementById('fuelSelectorViewContainer');
  const dieselCatView = document.getElementById('dieselCategoriesViewContainer');
  const gasCatView = document.getElementById('gasolinaCategoriesViewContainer');
  const brandsView = document.getElementById('brandsViewContainer');

  if (fuelView) fuelView.classList.add('d-none');
  if (dieselCatView) dieselCatView.classList.add('d-none');
  if (gasCatView) gasCatView.classList.add('d-none');
  if (brandsView) brandsView.classList.remove('d-none');

  updateBreadcrumbUI('category', fuelType === 'diesel' ? 'Diesel' : 'Gasolina', catTitle);

  const headerTitle = document.getElementById('vehiculosHeaderTitle');
  const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
  if (headerTitle) headerTitle.textContent = `MARCAS ${catTitle}`;
  if (headerSubtitle) headerSubtitle.textContent = `Seleccione la marca de ${catTitle} (${fuelType.toUpperCase()}) para ver modelos y diagramas`;
};

function updateBreadcrumbUI(level, fuelLabel = '', catLabel = '') {
  const sep1 = document.getElementById('bcrumbSep1');
  const bFuel = document.getElementById('bcrumbFuelType');
  const sep2 = document.getElementById('bcrumbSep2');
  const bCat = document.getElementById('bcrumbCategory');

  if (level === 'fuel') {
    if (sep1) sep1.classList.add('d-none');
    if (bFuel) bFuel.classList.add('d-none');
    if (sep2) sep2.classList.add('d-none');
    if (bCat) bCat.classList.add('d-none');
  } else if (level === 'fuel_type') {
    if (sep1) sep1.classList.remove('d-none');
    if (bFuel) {
      bFuel.classList.remove('d-none');
      bFuel.textContent = fuelLabel;
    }
    if (sep2) sep2.classList.add('d-none');
    if (bCat) bCat.classList.add('d-none');
  } else if (level === 'category') {
    if (sep1) sep1.classList.remove('d-none');
    if (bFuel) {
      bFuel.classList.remove('d-none');
      bFuel.textContent = fuelLabel;
    }
    if (sep2) sep2.classList.remove('d-none');
    if (bCat) {
      bCat.classList.remove('d-none');
      bCat.textContent = catLabel;
    }
  }
}

window.showBrandsView = function() {
  const fuelView = document.getElementById('fuelSelectorViewContainer');
  const dieselCatView = document.getElementById('dieselCategoriesViewContainer');
  const gasCatView = document.getElementById('gasolinaCategoriesViewContainer');
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (fuelView) fuelView.classList.add('d-none');
  if (dieselCatView) dieselCatView.classList.add('d-none');
  if (gasCatView) gasCatView.classList.add('d-none');
  if (brandsView) brandsView.classList.remove('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');

  const headerTitle = document.getElementById('vehiculosHeaderTitle');
  const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
  if (headerTitle) headerTitle.textContent = 'SELECCIONAR MARCA DE VEHÍCULO';
  if (headerSubtitle) headerSubtitle.textContent = 'Seleccione la marca de vehículo para consultar los esquemas de conexión y diagnóstico';
};

window.showModelsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.remove('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};

window.showEcuInfoView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.remove('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};

let pdfResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(pdfResizeTimer);
  pdfResizeTimer = setTimeout(() => {
    const canvas = document.getElementById('consolePdfCanvas');
    if (currentPdfDoc && canvas && !canvas.classList.contains('d-none')) {
      window.renderPdfPageOnCanvas(currentPdfPageNum);
    }
  }, 150);
});

// --- ADMIN MECHANICAL ICON PICKER FOR CONNECTION CARDS ---
let currentEditingCardKey = '';
let selectedMechanicalIconChoice = '';

window.openAdminMechanicalIconPicker = function(e, cardKey) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  currentEditingCardKey = cardKey;
  selectedMechanicalIconChoice = '';

  injectAdminMechanicalIconPickerModal();

  const titleSpan = document.getElementById('adminIconCardTitle');
  if (titleSpan) titleSpan.textContent = cardKey;

  const modalEl = document.getElementById('adminMechanicalIconPickerModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

function injectAdminMechanicalIconPickerModal() {
  if (document.getElementById('adminMechanicalIconPickerModal')) return;

  const mechanicalIcons = [
    { title: 'Pedal de Acelerador APP', icon: 'bi-sliders2' },
    { title: 'Mecánico con Llave', icon: 'bi-person-gear' },
    { title: 'Herramientas Cruzadas', icon: 'bi-wrench-adjustable' },
    { title: 'Pinzas / Caimanes de Carga', icon: 'bi-lightning-charge-fill' },
    { title: 'Motor & Capó Abierto', icon: 'bi-car-front-fill' },
    { title: 'Amortiguador / Suspensión', icon: 'bi-bounding-box-circles' },
    { title: 'Palanca de Cambios / Caja', icon: 'bi-diagram-2-fill' },
    { title: 'Aceitera & Lubricación', icon: 'bi-droplet-half' },
    { title: 'Batería Automotriz', icon: 'bi-battery-charging' },
    { title: 'Bujía de Encendido', icon: 'bi-lightning-fill' },
    { title: 'Elevador Hidráulico / Taller', icon: 'bi-truck-front-fill' },
    { title: 'Latonería & Pintura', icon: 'bi-palette-fill' },
    { title: 'Eje & Diferencial 4x4', icon: 'bi-gear-wide-connected' },
    { title: 'Neumático & Rueda', icon: 'bi-circle-square' },
    { title: 'Volante de Dirección', icon: 'bi-disc-fill' },
    { title: 'Velocímetro / Manómetro', icon: 'bi-speedometer2' },
    { title: 'Obturador / Mariposa TPS', icon: 'bi-circle-half' },
    { title: 'Inyectores / Combustible', icon: 'bi-fuel-pump-fill' },
    { title: 'Sensor Oxígeno LSU / Lambda', icon: 'bi-wind' },
    { title: 'Válvula IAC / Ralentí', icon: 'bi-fan' },
    { title: 'Sensor CKP / CMP / Giro', icon: 'bi-arrow-repeat' },
    { title: 'Osciloscopio / Señal PWM', icon: 'bi-activity' },
    { title: 'ECU / Computadora ECM', icon: 'bi-cpu-fill' },
    { title: 'Drivers IGBT / Módulo', icon: 'bi-motherboard-fill' },
    { title: 'Inmovilizador / Llave', icon: 'bi-key-fill' },
    { title: 'Red OBD-II / CAN Bus', icon: 'bi-hdd-network-fill' },
    { title: 'Conectores & Pinout', icon: 'bi-diagram-3-fill' },
    { title: 'Fusibles & Relés', icon: 'bi-toggle-on' }
  ];

  const iconChoicesHtml = mechanicalIcons.map(item => `
    <button type="button" class="btn btn-outline-dark btn-mech-icon-choice p-2 text-center" data-icon="${item.icon}" title="${item.title}" style="width: 70px; height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px;">
      <i class="bi ${item.icon} fs-3"></i>
      <span style="font-size: 8px; line-height: 1; margin-top: 4px; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</span>
    </button>
  `).join('');

  const modalHtml = `
    <div class="modal fade" id="adminMechanicalIconPickerModal" tabindex="-1" aria-labelledby="adminMechanicalIconPickerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
          <div class="modal-header bg-dark text-white border-0 py-3">
            <h5 class="modal-title font-rajdhani fw-bold d-flex align-items-center gap-2" id="adminMechanicalIconPickerModalLabel">
              <i class="bi bi-pencil-square text-danger fs-4"></i> PERSONALIZAR ÍCONO DE TARJETA (ADMIN)
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4" style="max-height: 80vh; overflow-y: auto;">
            <div class="alert alert-info border-0 mb-3 py-2 small">
              <i class="bi bi-info-circle-fill me-1"></i>
              Selecciona el ícono mecánico representativo para la tarjeta: <strong id="adminIconCardTitle" class="text-danger">TARJETA</strong>
            </div>

            <!-- Mechanical & Electronic Icons Grid -->
            <label class="form-label font-rajdhani fw-bold text-dark mb-2">Seleccione el ícono automotriz/mecánico:</label>
            <div class="d-flex align-items-center justify-content-center gap-2 flex-wrap mb-4" id="mechIconsContainer">
              ${iconChoicesHtml}
            </div>

            <!-- Custom URL or SVG -->
            <div class="mb-3">
              <label for="adminCustomIconInput" class="form-label font-rajdhani fw-bold text-dark mb-1">O ingrese una ruta SVG / URL de imagen personalizada:</label>
              <input type="text" class="form-control form-control-sm" id="adminCustomIconInput" placeholder="Ej: imagenes svg/ico_logo_toyota.svg o bi-sliders2">
            </div>

          </div>
          <div class="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold" onclick="saveAdminMechanicalIconChoice()">
              <i class="bi bi-check-lg me-1"></i> Aplicar a la Tarjeta
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('adminMechanicalIconPickerModal');
  if (!modalEl) return;

  modalEl.querySelectorAll('.btn-mech-icon-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      modalEl.querySelectorAll('.btn-mech-icon-choice').forEach(b => b.classList.remove('active', 'btn-danger', 'text-white'));
      btn.classList.add('active', 'btn-danger', 'text-white');
      selectedMechanicalIconChoice = btn.dataset.icon;
      const customInput = document.getElementById('adminCustomIconInput');
      if (customInput) customInput.value = selectedMechanicalIconChoice;
    });
  });
}

window.saveAdminMechanicalIconChoice = async function() {
  const customInput = document.getElementById('adminCustomIconInput');
  if (customInput && customInput.value.trim()) {
    selectedMechanicalIconChoice = customInput.value.trim();
  }

  if (!currentEditingCardKey || !selectedMechanicalIconChoice) {
    alert('Por favor seleccione un ícono para aplicar.');
    return;
  }

  // Save to Local Storage
  try {
    const saved = JSON.parse(localStorage.getItem('probaktronic_card_icons') || '{}');
    saved[currentEditingCardKey] = selectedMechanicalIconChoice;
    localStorage.setItem('probaktronic_card_icons', JSON.stringify(saved));
  } catch (e) {}

  // Save to Firestore under app_config/iconos_tarjetas
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      await db.collection('app_config').doc('iconos_tarjetas').set({
        [currentEditingCardKey]: selectedMechanicalIconChoice
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Guardado en caché local para tarjetas:', err);
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`Ícono actualizado para ${currentEditingCardKey}`);
  }

  // Reload connection cards view
  if (typeof window.renderVehiculoConexionesView === 'function' && window.currentSelectedVehicleData) {
    window.renderVehiculoConexionesView(window.currentSelectedVehicleData);
  } else {
    location.reload();
  }

  const modalEl = document.getElementById('adminMechanicalIconPickerModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();
  }
};

// --- ADMIN DIAGRAM UPLOAD CONTROLLER ---

window.openAdminAddDiagramModal = function(e) {
  if (e) e.preventDefault();

  const user = window.probaktronicCurrentUser;
  const isAdmin = user && (user.email === 'prueba@probak.com');

  if (!isAdmin) {
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('Acceso exclusivo para el Administrador del sistema.');
    } else {
      alert('Acceso exclusivo para el Administrador del sistema.');
    }
    return;
  }

  // Pre-fill defaults based on current selection
  if (currentSelectedFuelType) {
    window.setAdminModalFuel(currentSelectedFuelType);
  } else {
    window.setAdminModalFuel('diesel');
  }

  const modalEl = document.getElementById('adminAddDiagramModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

window.setAdminModalFuel = function(fuelType) {
  const boxDiesel = document.getElementById('fuelBoxDiesel');
  const boxGasolina = document.getElementById('fuelBoxGasolina');
  const radioDiesel = document.getElementById('adminRadioDiesel');
  const radioGasolina = document.getElementById('adminRadioGasolina');
  const catSelect = document.getElementById('adminModalCategorySelect');

  if (fuelType === 'diesel') {
    if (boxDiesel) { boxDiesel.classList.add('border-danger', 'bg-danger-subtle'); boxDiesel.classList.remove('bg-white'); }
    if (boxGasolina) { boxGasolina.classList.remove('border-danger', 'bg-danger-subtle'); boxGasolina.classList.add('bg-white'); }
    if (radioDiesel) radioDiesel.checked = true;

    if (catSelect) {
      catSelect.innerHTML = `
        <option value="pickup" selected>🛻 PICKUP / CAMIONETAS (Hilux, Frontier, Ranger...)</option>
        <option value="furgon">🚐 FURGÓN / VAN (H1, Sprinter, Transit...)</option>
        <option value="camiones">🚛 CAMIONES / PESADO (Isuzu N-Series, Hino, Fuso...)</option>
        <option value="maquinaria">🚜 MAQUINARIA PESADA (Caterpillar, Komatsu, JCB...)</option>
      `;
    }
  } else {
    if (boxGasolina) { boxGasolina.classList.add('border-danger', 'bg-danger-subtle'); boxGasolina.classList.remove('bg-white'); }
    if (boxDiesel) { boxDiesel.classList.remove('border-danger', 'bg-danger-subtle'); boxDiesel.classList.add('bg-white'); }
    if (radioGasolina) radioGasolina.checked = true;

    if (catSelect) {
      catSelect.innerHTML = `
        <option value="sedan" selected>🚗 SEDÁN / HATCHBACK (Corolla, Yaris, Accent...)</option>
        <option value="suv">🚙 SUV / CROSSOVER (RAV4, Tucson, Sportage...)</option>
        <option value="pickup_gas">🛻 PICKUP GASOLINA (Tacoma, Hilux Gasolina...)</option>
      `;
    }
  }
};

window.setDiagramTitlePreset = function(preset) {
  const brand = (document.getElementById('adminModalBrandInput')?.value || '').trim().toUpperCase();
  const model = (document.getElementById('adminModalModelInput')?.value || '').trim().toUpperCase();
  const year = (document.getElementById('adminModalYearInput')?.value || '').trim();
  const titleInput = document.getElementById('adminModalDiagramTitleInput');

  let base = `${brand} ${model} ${year}`.trim();
  if (!base) base = 'VEHÍCULO';

  if (titleInput) {
    titleInput.value = `${base} ${preset}`.trim();
  }
};

let adminSelectedDiagramFile = null;

window.handleAdminModalFileChange = function(input) {
  const badgeWrap = document.getElementById('adminModalFilePreviewWrap');
  const badgeName = document.getElementById('adminModalFileNameBadge');

  if (input.files && input.files[0]) {
    adminSelectedDiagramFile = input.files[0];
    if (badgeWrap && badgeName) {
      badgeName.textContent = `Archivo: ${adminSelectedDiagramFile.name} (${(adminSelectedDiagramFile.size / 1024).toFixed(1)} KB)`;
      badgeWrap.classList.remove('d-none');
    }
  } else {
    adminSelectedDiagramFile = null;
    if (badgeWrap) badgeWrap.classList.add('d-none');
  }
};

window.handleAdminSubmitNewDiagram = async function(e) {
  e.preventDefault();

  const user = window.probaktronicCurrentUser;
  if (!user || user.email !== 'prueba@probak.com') {
    alert('Permiso denegado: solo el administrador puede publicar diagramas.');
    return;
  }

  const fuelType = document.querySelector('input[name="adminModalFuelRadio"]:checked')?.value || 'diesel';
  const category = document.getElementById('adminModalCategorySelect')?.value || 'pickup';
  const rawBrand = (document.getElementById('adminModalBrandInput')?.value || '').trim();
  const rawModel = (document.getElementById('adminModalModelInput')?.value || '').trim();
  const rawYear = (document.getElementById('adminModalYearInput')?.value || '').trim();
  const rawMotor = (document.getElementById('adminModalMotorInput')?.value || '').trim();
  const rawTitle = (document.getElementById('adminModalDiagramTitleInput')?.value || '').trim();

  if (!rawBrand || !rawModel || !rawYear || !rawMotor || !rawTitle || !adminSelectedDiagramFile) {
    alert('Por favor completa todos los campos y selecciona el archivo del diagrama.');
    return;
  }

  const btnSubmit = document.getElementById('btnAdminSubmitDiagram');
  const progressWrap = document.getElementById('adminModalProgressBarWrap');
  const progressBar = document.getElementById('adminModalProgressBar');
  const statusMsg = document.getElementById('adminModalStatusMsg');

  if (btnSubmit) btnSubmit.disabled = true;
  if (progressWrap) progressWrap.classList.remove('d-none');
  if (progressBar) progressBar.style.width = '25%';
  if (statusMsg) {
    statusMsg.className = 'small text-center fw-bold text-primary';
    statusMsg.textContent = 'Subiendo archivo a Firebase Storage...';
  }

  try {
    ensureFirebaseInitialized();
    const db = firebase.firestore();
    let fileDownloadUrl = '';

    const brandUpper = rawBrand.toUpperCase().trim();
    const brandDocId = rawBrand.toLowerCase().trim();
    const modelLower = rawModel.toLowerCase().trim();
    const cleanFileName = adminSelectedDiagramFile.name;
    const motorFolder = `${rawYear} motor ${modelLower} ${rawMotor}`.trim();

    // 1. Upload to Firebase Storage in exact folder hierarchy:
    // gs://probaktronic-app.firebasestorage.app/diagramas/TOYOTA/hilux/2011 - 2015 motor hilux 2kd o 1kd/
    try {
      if (typeof firebase.storage === 'function') {
        const storageRef = firebase.storage().ref();
        const uploadPath = `diagramas/${brandUpper}/${modelLower}/${motorFolder}/${cleanFileName}`;
        const fileRef = storageRef.child(uploadPath);

        if (progressBar) progressBar.style.width = '50%';
        const uploadSnapshot = await fileRef.put(adminSelectedDiagramFile);
        fileDownloadUrl = await uploadSnapshot.ref.getDownloadURL();
      }
    } catch (storageErr) {
      console.warn('Storage upload fallback:', storageErr);
      // Fallback: Read as Data URL
      fileDownloadUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(adminSelectedDiagramFile);
      });
    }

    if (progressBar) progressBar.style.width = '75%';
    if (statusMsg) statusMsg.textContent = 'Guardando estructura compatible en Firestore...';

    // 2. Write exact hierarchy into Firestore:
    // diagramas/{brandDocId}/modelos/{modelDocId}/anios/{rawYear}/motores/{rawMotor}/archivos/{rawTitle}

    // Step A: Brand Document
    await db.collection('diagramas').doc(brandDocId).set({
      nombre: rawBrand.toUpperCase(),
      marca: rawBrand.toUpperCase(),
      ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Step B: Model Document
    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId).set({
      nombre: `${rawBrand} ${rawModel} ${rawYear}`.toUpperCase(),
      modelo: rawModel,
      marca: rawBrand.toUpperCase(),
      combustible: fuelType,
      categoria: category
    }, { merge: true });

    // Step C: Anios Document
    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId).collection('anios').doc(rawYear).set({
      anio: rawYear
    }, { merge: true });

    // Step D: Motores Document
    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId).collection('anios').doc(rawYear).collection('motores').doc(rawMotor).set({
      combustible: fuelType,
      categoria: category,
      titulo: `${rawModel} ${rawMotor}`.toLowerCase(),
      imageUrl: fileDownloadUrl,
      motor: rawMotor
    }, { merge: true });

    // Step E: Archivos Document (The diagram file)
    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId).collection('anios').doc(rawYear).collection('motores').doc(rawMotor).collection('archivos').doc(rawTitle).set({
      titulo: rawTitle,
      url: fileDownloadUrl,
      imageUrl: fileDownloadUrl,
      combustible: fuelType,
      categoria: category,
      motor: rawMotor,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (progressBar) progressBar.style.width = '100%';
    if (statusMsg) {
      statusMsg.className = 'small text-center fw-bold text-success';
      statusMsg.textContent = '¡Diagrama publicado con éxito en Firestore!';
    }

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast(`¡Diagrama "${rawTitle}" publicado con éxito! Sincronizado con la Web y Android Studio.`);
    }

    setTimeout(() => {
      // Close Modal & Reset Form
      const modalEl = document.getElementById('adminAddDiagramModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      }
      document.getElementById('adminAddDiagramForm')?.reset();
      if (progressWrap) progressWrap.classList.add('d-none');
      if (progressBar) progressBar.style.width = '0%';
      if (statusMsg) statusMsg.textContent = '';
      if (btnSubmit) btnSubmit.disabled = false;

      // Reload brands/models view
      const brandGrid = document.getElementById('vehiculosBrandGrid');
      if (brandGrid) loadFirestoreDiagramasBrands(brandGrid);
    }, 1200);

  } catch (error) {
    console.error('Error publicando diagrama:', error);
    if (btnSubmit) btnSubmit.disabled = false;
    if (statusMsg) {
      statusMsg.className = 'small text-center fw-bold text-danger';
      statusMsg.textContent = `Error al guardar: ${error.message}`;
    }
  }
};

// Check admin button visibility on Auth change
function checkAdminButtonVisibility() {
  const btn = document.getElementById('btnAdminAddDiagram');
  if (!btn) return;
  const user = window.probaktronicCurrentUser;
  if (user && user.email === 'prueba@probak.com') {
    btn.classList.remove('d-none');
  } else {
    btn.classList.add('d-none');
  }
}

document.addEventListener('DOMContentLoaded', checkAdminButtonVisibility);
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(() => checkAdminButtonVisibility());
}
