
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
        <p class="text-muted small mb-0">No hay modelos que coincidan con "<strong>${rawQuery}</strong>". Intenta buscar por otro modelo, motor o código.</p>
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

// Bobinas & Vehicle Brand Selector Controller for Probaktronic
// Conexión Robusta con Cloud Firestore y Firebase Storage con Pantalla de Carga 0-100%

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

let currentSelectedBrandId = null;
let currentSelectedBrandName = null;
window.currentModelsDataStore = {};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBobinasModule);
} else {
  initBobinasModule();
}

function initBobinasModule() {
  setupModelSearchFilter();
  const searchInput = document.getElementById('brandSearchInput');
  const alphabetLetters = document.querySelectorAll('.alphabet-letter');
  const brandGrid = document.getElementById('bobinasBrandGrid');
  const tabs = document.querySelectorAll('.section-tab-item');

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
  const btnBackView = document.getElementById('btnBackView');
  if (btnBackView) {
    btnBackView.addEventListener('click', (e) => {
      const brandsView = document.getElementById('brandsViewContainer');
      const modelsView = document.getElementById('modelsViewContainer');
      const diagramView = document.getElementById('diagramViewContainer');

      // 1. If currently in Diagram Viewer (View 3), go back to Models List (View 2)
      if (diagramView && !diagramView.classList.contains('d-none')) {
        e.preventDefault();
        showModelsView();
        return;
      }

      // 2. If currently in Models List (View 2), go back to Brands Grid (View 1)
      if (modelsView && !modelsView.classList.contains('d-none')) {
        e.preventDefault();
        showBrandsView();
        return;
      }

      // 3. If currently in Brands Grid (View 1), allow normal navigation back to sensores-actuadores.html
    });
  }


  // Query Firestore collection 'bobinas'
  loadFirestoreBobinas(brandGrid);
}

// Universal Helper: Render Centered 0-100% Firebase Loader Card
window.createCenteredFirebaseLoader = function(container, subtitleText = 'Conectando con Cloud Firestore...') {
  if (!container) return null;

  container.innerHTML = `
    <div class="catalog-loader-container w-100 py-4" style="grid-column: 1 / -1;">
      <div class="loader-card mx-auto">
        <img src="logo_probaktronic_solo.png" alt="Probaktronic" height="52" class="pulse-animation mb-3">
        <h4 class="font-rajdhani fw-bold text-uppercase mb-1 text-dark">CARGANDO DESDE FIREBASE</h4>
        <p class="text-muted small mb-3">${subtitleText}</p>
        <div class="progress w-100 mb-2" style="height: 8px; border-radius: 4px; background-color: #E2E8F0;">
          <div class="loader-progress-bar progress-bar progress-bar-striped progress-bar-animated bg-danger" style="width: 0%;"></div>
        </div>
        <div class="loader-progress-percent fw-bold fs-4 text-danger font-rajdhani">0%</div>
      </div>
    </div>
  `;

  const bar = container.querySelector('.loader-progress-bar');
  const percentEl = container.querySelector('.loader-progress-percent');

  let currentPercent = 0;
  const timer = setInterval(() => {
    if (currentPercent < 90) {
      currentPercent += Math.floor(Math.random() * 15) + 10;
      if (currentPercent > 90) currentPercent = 90;
      if (bar) bar.style.width = currentPercent + '%';
      if (percentEl) percentEl.textContent = currentPercent + '%';
    }
  }, 80);

  return {
    finish: (callback) => {
      clearInterval(timer);
      if (bar) bar.style.width = '100%';
      if (percentEl) percentEl.textContent = '100%';
      setTimeout(() => {
        if (callback) callback();
      }, 200);
    }
  };
};

function getBrandLogoUrl(brandKey) {
  const clean = brandKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of Object.keys(localBrandLogoMap)) {
    if (clean.includes(key.replace(/[^a-z0-9]/g, '')) || key.replace(/[^a-z0-9]/g, '').includes(clean)) {
      return localBrandLogoMap[key];
    }
  }
  return 'logo_probaktronic_solo.png';
}

function loadFirestoreBobinas(grid) {
  if (!grid) return;

  const loader = window.createCenteredFirebaseLoader(grid, 'Conectando con Base de Datos de Bobinas...');

  // Intentar cargar desde API MySQL, fallback a data/bobinas.json
  const fetchBrands = async () => {
    let brandList = [];
    try {
      const res = await fetch('api/bobinas.php');
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          brandList = (json.data || []).map(b => ({
            id: b.Slug || b.Nombre.toLowerCase(),
            nombre: b.Nombre,
            logo: b.LogoUrl || getBrandLogoUrl(b.Slug || b.Nombre)
          }));
        }
      }
    } catch (e) {
      console.log('API PHP no disponible, usando almacén local de bobinas...');
    }

    if (!brandList || brandList.length === 0) {
      try {
        const localRes = await fetch('data/bobinas.json');
        if (localRes.ok) {
          const localData = await localRes.json();
          window.localBobinasStore = localData;
          brandList = Object.keys(localData).map(k => ({
            id: k,
            nombre: k.charAt(0).toUpperCase() + k.slice(1),
            logo: getBrandLogoUrl(k)
          }));
        }
      } catch (err) {
        console.error('Error cargando almacén local:', err);
      }
    }

    loader.finish(() => {
      if (brandList && brandList.length > 0) {
        grid.innerHTML = '';
        brandList.sort((a, b) => a.nombre.localeCompare(b.nombre));

        brandList.forEach(brand => {
          const docId = brand.id;
          const displayName = brand.nombre;
          const logoSrc = brand.logo || getBrandLogoUrl(docId);

          const card = document.createElement('div');
          card.className = 'brand-card';
          card.setAttribute('data-brand', displayName);
          card.setAttribute('data-doc-id', docId);
          card.innerHTML = `
            <img src="${logoSrc}" alt="${displayName}" class="brand-logo-img" onerror="this.src='logo_probaktronic_solo.png'">
            <h4 class="brand-name-title">${displayName}</h4>
          `;
          card.onclick = () => openBrandModels(docId, displayName, logoSrc);
          grid.appendChild(card);
        });
      } else {
        grid.innerHTML = `
          <div class="w-100 text-center py-4" style="grid-column: 1 / -1;">
            <p class="text-muted">No se encontraron marcas de bobinas registradas.</p>
          </div>
        `;
      }
    });
  };

  fetchBrands();
}

// Open Models for Selected Brand
window.openBrandModels = async function(brandDocId, brandName, logoSrc) {
  const mSearch = document.getElementById('modelSearchInput');
  if (mSearch) mSearch.value = '';
  const mClear = document.getElementById('clearModelSearchBtn');
  if (mClear) mClear.classList.add('d-none');
  const noRes = document.getElementById('noModelSearchResults');
  if (noRes) noRes.style.display = 'none';
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
  if (brandTitle) brandTitle.textContent = `${brandName} - Modelos de Bobinas`;

  if (!modelsListGrid) return;

  const loader = window.createCenteredFirebaseLoader(modelsListGrid, `Cargando modelos de ${brandName}...`);

  let models = [];
  const cleanBrand = brandDocId.toLowerCase().trim();

  // 1. Intentar desde API MySQL
  try {
    const res = await fetch(`api/bobinas.php?marca=${encodeURIComponent(cleanBrand)}`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await res.json();
        models = json.data || [];
      }
    }
  } catch (e) {}

  // 2. Fallback a data/bobinas.json
  if (!models || models.length === 0) {
    if (!window.localBobinasStore) {
      try {
        const localRes = await fetch('data/bobinas.json');
        if (localRes.ok) window.localBobinasStore = await localRes.json();
      } catch (err) {}
    }
    if (window.localBobinasStore && window.localBobinasStore[cleanBrand]) {
      models = window.localBobinasStore[cleanBrand];
    }
  }

  loader.finish(() => {
    if (models && models.length > 0) {
      modelsListGrid.innerHTML = '';
      
      models.forEach((item, index) => {
        const docId = item.Codigo || item.modelo || `Bobina #${index + 1}`;
        window.currentModelsDataStore[docId] = item;

        const modelName = item.modelo || item.Descripcion || docId;
        const motor = item.motor || item.TipoBobina || 'COP';

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
              <span class="model-card-badge badge-gasolina">Bobina COP / DIS</span>
              <h4 class="model-card-title" title="${docId}">${docId}</h4>
              <p class="model-card-subtitle" title="${modelName}">${modelName}</p>
            </div>
          </div>
          <div class="model-card-footer">
            <span class="model-card-motor">Motor / Tipo: <strong>${motor}</strong></span>
            <i class="bi bi-chevron-right"></i>
          </div>
        `;

        card.onclick = () => openDiagramViewer(docId);
        modelsListGrid.appendChild(card);
      });

      setupModelSearchFilter();
    } else {
      modelsListGrid.innerHTML = `
        <div class="w-100 text-center py-4" style="grid-column: 1 / -1;">
          <p class="text-muted">No se encontraron modelos para ${brandName}.</p>
        </div>
      `;
    }
  });
};

// Open Diagram Viewer for Selected Model (Protected View)
window.openDiagramViewer = async function(docId) {
  const data = window.currentModelsDataStore[docId] || {};
  console.log(`Displaying diagram for [${docId}]:`, data);

  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.remove('d-none');

  const titleEl = document.getElementById('diagramModelTitle');
  const motorEl = document.getElementById('diagramMotorCode');
  const imgContainer = document.getElementById('diagramImgContainer');

  const modelTitle = data.modelo || data.Descripcion || docId;
  const motorCode = data.motor || data.TipoBobina || 'N/A';

  if (titleEl) titleEl.textContent = `${currentSelectedBrandName} - ${modelTitle}`;
  if (motorEl) motorEl.textContent = `Código / Tipo: ${motorCode}`;

  const pinoutEl = document.getElementById('diagramPinoutText');
  const procedureEl = document.getElementById('diagramProcedureText');

  const customPinout = data.pinout || data.Pinout || data.senial || 'Pin 1: +12V Batería | Pin 2: Tierra Chasis | Pin 3: Pulso ECU';
  const customProcedure = data.procedimiento || data.Descripcion || 'Medir señal PWM con osciloscopio o punta lógica Probaktronic';

  if (pinoutEl) pinoutEl.textContent = typeof customPinout === 'object' ? JSON.stringify(customPinout) : customPinout;
  if (procedureEl) procedureEl.textContent = customProcedure;

  if (!imgContainer) return;

  const loader = window.createCenteredFirebaseLoader(imgContainer, `Cargando esquema de ${docId}...`);

  // Ruta local del esquema descargado
  const brandSlug = (currentSelectedBrandId || '').toLowerCase().trim();
  const cleanCode = docId.replace(/[^a-zA-Z0-9_-]/g, '_');
  let finalImageUrl = data.RutaLocal || `archivos_almacenamiento/bobinas/${brandSlug}/${cleanCode}.png`;

  if (!data.RutaLocal && data.ImagenUrl) {
    finalImageUrl = data.ImagenUrl;
  }

  if (!finalImageUrl) {
    loader.finish(() => {
      imgContainer.innerHTML = `
        <div class="p-4 text-center text-muted">
          <i class="bi bi-image fs-1 d-block mb-2"></i>
          <p>No se encontró un esquema disponible para <code>${docId}</code>.</p>
        </div>
      `;
    });
    return;
  }

  // Render Image directly with Protection + Multi-level Click & Hover Zoom System
  loader.finish(() => {
    imgContainer.innerHTML = `
      <div class="protected-image-wrapper position-relative text-center w-100" id="zoomWrapper" oncontextmenu="return false;" ondragstart="return false;">
        <span class="badge bg-dark opacity-75 position-absolute top-0 end-0 m-2" id="zoomLevelBadge" style="z-index: 15; pointer-events: none; font-size: 0.75rem;">Sutil Hover (1.35x) • Clic para +Zoom</span>
        <img src="${finalImageUrl}" alt="${modelTitle}" id="zoomImage" class="diagram-viewer-modal-img unselectable-image" referrerpolicy="no-referrer"
             oncontextmenu="return false;" ondragstart="return false;" draggable="false">
        <div class="security-shield-overlay" id="zoomShield" oncontextmenu="return false;" ondragstart="return false;"></div>
      </div>
    `;

    // Multi-level Zoom System:
    // State 0 = Slight Hover (1.35x)
    // State 1 = 1st Click (Medium 2.0x)
    // State 2 = 2nd Click (Max 3.0x)
    // State 3 = 3rd Click (Reset 1.0x)
    let zoomLevelState = 0; // 0 = default hover mode, 1 = med, 2 = high

    const shield = document.getElementById('zoomShield');
    const img = document.getElementById('zoomImage');
    const wrapper = document.getElementById('zoomWrapper');
    const badge = document.getElementById('zoomLevelBadge');

    if (shield && img && wrapper) {
      // Mouse move tracks cursor position dynamically
      shield.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${x}% ${y}%`;

        if (zoomLevelState === 0) {
          img.style.transform = 'scale(1.35)'; // Slight hover zoom
        } else if (zoomLevelState === 1) {
          img.style.transform = 'scale(2.0)'; // 1st click medium zoom
        } else if (zoomLevelState === 2) {
          img.style.transform = 'scale(3.0)'; // 2nd click max zoom
        }
      });

      // Sequential Click handler (1st click -> 2.0x, 2nd click -> 3.0x, 3rd click -> Reset)
      shield.addEventListener('click', (e) => {
        e.preventDefault();

        zoomLevelState = (zoomLevelState + 1) % 3; // Cycles: 0 -> 1 -> 2 -> 0

        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${x}% ${y}%`;

        if (zoomLevelState === 0) {
          img.style.transform = 'scale(1.35)';
          if (badge) {
            badge.textContent = 'Zoom Normal • Clic para +Zoom';
            badge.className = 'badge bg-dark opacity-75 position-absolute top-0 end-0 m-2';
          }
        } else if (zoomLevelState === 1) {
          img.style.transform = 'scale(2.0)';
          if (badge) {
            badge.textContent = 'Zoom Medio (2.0x) • Clic para Máximo';
            badge.className = 'badge bg-danger position-absolute top-0 end-0 m-2';
          }
        } else if (zoomLevelState === 2) {
          img.style.transform = 'scale(3.0)';
          if (badge) {
            badge.textContent = 'Zoom Máximo (3.0x) • Clic para Reiniciar';
            badge.className = 'badge bg-danger position-absolute top-0 end-0 m-2';
          }
        }
      });

      // Mouse leave resets to normal 1.0x
      shield.addEventListener('mouseleave', () => {
        zoomLevelState = 0;
        img.style.transformOrigin = 'center center';
        img.style.transform = 'scale(1)';
        if (badge) {
          badge.textContent = 'Sutil Hover (1.35x) • Clic para +Zoom';
          badge.className = 'badge bg-dark opacity-75 position-absolute top-0 end-0 m-2';
        }
      });
    }
  });
};

window.showBrandsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.remove('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};

window.showModelsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.remove('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};
