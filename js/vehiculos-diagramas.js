
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

function getDeletedItemsList(type) {
  try {
    return JSON.parse(localStorage.getItem(`probaktronic_deleted_${type}`) || '[]');
  } catch (e) {
    return [];
  }
}

function markItemAsDeleted(type, id) {
  if (!id) return;
  const cleanId = String(id).toLowerCase().trim();
  try {
    const list = getDeletedItemsList(type);
    if (!list.includes(cleanId)) {
      list.push(cleanId);
      localStorage.setItem(`probaktronic_deleted_${type}`, JSON.stringify(list));
    }
  } catch (e) {}

  // Sync to Firestore app_config/deleted_items
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      db.collection('app_config').doc('deleted_items').set({
        [type]: firebase.firestore.FieldValue.arrayUnion(cleanId)
      }, { merge: true }).catch(() => {});
    }
  } catch (e) {}
}

const defaultDiagramBrands = [
  { id: 'hyundai', name: 'Hyundai', logo: getBrandLogoUrl('hyundai') },
  { id: 'toyota', name: 'Toyota', logo: getBrandLogoUrl('toyota') }
];

let cachedActiveBrands = null;

function loadFirestoreDiagramasBrands(grid) {
  if (!grid) {
    grid = document.getElementById('vehiculosBrandGrid');
    if (!grid) return;
  }

  const deletedBrands = getDeletedItemsList('brands');

  // Render immediately from cache/filtered defaults
  const initialList = (cachedActiveBrands || defaultDiagramBrands).filter(b => !deletedBrands.includes(b.id.toLowerCase().trim()) && !deletedBrands.includes(b.name.toLowerCase().trim()));
  renderOnlyActiveBrands(grid, null, initialList);

  ensureFirebaseSDKReady(() => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      return;
    }

    const db = firebase.firestore();
    db.collection('diagramas').get()
      .then(snapshot => {
        const firestoreBrands = [];
        const currentDeleted = getDeletedItemsList('brands');

        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            const docId = doc.id.toLowerCase().trim();
            if (currentDeleted.includes(docId)) return; // Skip deleted

            const data = doc.data() || {};
            const brandName = (data.nombre || data.marca || docId).trim();
            if (currentDeleted.includes(brandName.toLowerCase().trim())) return; // Skip deleted

            const displayName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
            const logoSrc = data.logo || data.imagen || getBrandLogoUrl(docId);
            firestoreBrands.push({
              id: docId,
              name: displayName,
              logo: logoSrc,
              data: data
            });
          });
        }

        cachedActiveBrands = firestoreBrands;
        renderOnlyActiveBrands(grid, null, firestoreBrands);
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

    const deletedBrands = getDeletedItemsList('brands');
    let list = (brandList !== null && brandList !== undefined) ? brandList : (cachedActiveBrands || defaultDiagramBrands);
    list = list.filter(b => !deletedBrands.includes(b.id.toLowerCase().trim()) && !deletedBrands.includes(b.name.toLowerCase().trim()));

    list.forEach(b => {
      const docId = b.id;
      const displayName = b.name;
      const logoSrc = b.logo || getBrandLogoUrl(docId);

      const isAdmin = (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email === 'prueba@probak.com');
      const editBrandBtn = isAdmin ? `
        <button class="btn btn-sm btn-light rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center text-danger position-absolute top-0 end-0 m-1" style="width: 26px; height: 26px; z-index: 15;" title="Editar o Gestionar Marca (Admin)" onclick="openAdminEditItemModal(event, 'brand', { id: '${docId}', name: '${displayName}' })">
          <i class="bi bi-pencil-fill" style="font-size: 10px;"></i>
        </button>
      ` : '';

      const card = document.createElement('div');
      card.className = 'brand-card position-relative';
      card.setAttribute('data-brand', displayName);
      card.setAttribute('data-doc-id', docId);

      card.innerHTML = `
        ${editBrandBtn}
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

    // Admin Card: + AGREGAR MARCA
    const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
      ? window.isProbaktronicAdmin() 
      : (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin' || window.probaktronicCurrentUser.isAdmin === true));

    if (isAdmin) {
      const addBrandCard = document.createElement('div');
      addBrandCard.className = 'brand-card border-dashed d-flex flex-column align-items-center justify-content-center text-center cursor-pointer';
      addBrandCard.style.border = '2px dashed rgba(211, 47, 47, 0.45)';
      addBrandCard.style.backgroundColor = 'rgba(211, 47, 47, 0.03)';
      addBrandCard.style.minHeight = '140px';
      addBrandCard.innerHTML = `
        <div class="text-danger mb-2">
          <i class="bi bi-plus-circle-fill fs-1"></i>
        </div>
        <h4 class="brand-name-title text-danger fw-bold" style="font-size: 0.95rem;">+ AGREGAR MARCA</h4>
        <span class="text-muted small" style="font-size: 0.72rem;">Registrar nueva marca</span>
      `;
      addBrandCard.onclick = (e) => {
        if (e) e.stopPropagation();
        window.openAdminAddBrandModal();
      };
      grid.appendChild(addBrandCard);
    }
  };

  if (loader && typeof loader.finish === 'function') {
    loader.finish(doRender);
  } else {
    doRender();
  }
}

window._modelsCacheByBrand = window._modelsCacheByBrand || {};

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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }

  const topAddModelBtn = document.getElementById('btnAdminTopAddModel');
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
    ? window.isProbaktronicAdmin() 
    : (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin' || window.probaktronicCurrentUser.isAdmin === true));

  if (topAddModelBtn) {
    if (isAdmin) topAddModelBtn.classList.remove('d-none');
    else topAddModelBtn.classList.add('d-none');
  }

  if (brandLogo) brandLogo.src = logoSrc || 'logo_probaktronic_solo.png';
  if (brandTitle) brandTitle.textContent = `${brandName} - Diagramas de Vehículos`;
  const mSearch = document.getElementById('modelSearchInput');
  if (mSearch) mSearch.value = '';
  const mClear = document.getElementById('clearModelSearchBtn');
  if (mClear) mClear.classList.add('d-none');
  const noRes = document.getElementById('noModelSearchResults');
  if (noRes) noRes.style.display = 'none';

  if (modelsListGrid) {
    const cacheKey = `${collectionName}_${brandDocId}`;
    if (window._modelsCacheByBrand[cacheKey] && window._modelsCacheByBrand[cacheKey].length > 0) {
      renderModelEntries(window._modelsCacheByBrand[cacheKey], brandName, modelsListGrid);
      return;
    }

    const loader = safeCreateCenteredLoader(modelsListGrid, `Conectando con Cloud Firestore para descargar diagramas de ${brandName}...`);

    if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
      return;
    }

    const db = firebase.firestore();
    db.collection(collectionName).doc(brandDocId).collection('modelos').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          renderModelCardsFromSnapshot(snapshot, brandName, modelsListGrid, loader, cacheKey);
        } else {
          db.collection('bobinas').doc(brandDocId).collection('modelos').get().then(bobinasSnap => {
            if (!bobinasSnap.empty) {
              renderModelCardsFromSnapshot(bobinasSnap, brandName, modelsListGrid, loader, cacheKey);
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

  const combined = ((modelName || '') + ' ' + (motor || '') + ' ' + (data.modelo || '') + ' ' + (data.nombre || '') + ' ' + (data.id || '') + ' ' + (data.anio || '') + ' ' + (data.titulo || '')).toLowerCase();
  const isDiesel = /\b(diesel|diésel|hilux|fortuner|hiace|d-4d|d4d|1kd|2kd|1gd|2gd|crdi|tdi|hdi|dci|tdci|cdti|jtd|multijet|amarok|ranger|frontier|navara|dmax|d-max|l200|triton|bt-50|bt50|terracan|h1|h-1|h100|porter|canter|isuzu|fuso|hino|cummins|powerstroke|duramax)\b/i.test(combined);
  if (isDiesel) {
    return { name: 'DIÉSEL', isDiesel: true, cssClass: 'badge-diesel' };
  }

  return { name: 'GASOLINA', isDiesel: false, cssClass: 'badge-gasolina' };
}

async function renderModelCardsFromSnapshot(snapshot, brandName, modelsListGrid, loader, cacheKey) {
  const modelEntries = await Promise.all(snapshot.docs.map(async doc => {
    const data = doc.data() || {};
    const docId = doc.id;

    // Deep subcollection inspection in parallel if combustible or motor is not explicitly on model doc
    if (!data.combustible || !data.motor) {
      try {
        const aniosSnap = await doc.ref.collection('anios').get().catch(() => null);
        if (aniosSnap && !aniosSnap.empty) {
          await Promise.all(aniosSnap.docs.map(async anioDoc => {
            if (!data.anio) data.anio = anioDoc.id;
            const aData = anioDoc.data() || {};
            if (aData.combustible && !data.combustible) data.combustible = aData.combustible;

            const motoresSnap = await anioDoc.ref.collection('motores').get().catch(() => null);
            if (motoresSnap && !motoresSnap.empty) {
              motoresSnap.docs.forEach(mDoc => {
                const mData = mDoc.data() || {};
                if (!data.motor) data.motor = mData.motor || mDoc.id;
                if (!data.combustible && mData.combustible) data.combustible = mData.combustible;
                if (mData.imagenUrl) data.ecuImageUrl = mData.imagenUrl;
                if (!data.titulo && mData.titulo) data.titulo = mData.titulo;
              });
            }
          }));
        }
      } catch (errSub) {
        console.warn('Subcollection scan notice:', errSub);
      }
    }

    // Auto-fill fuelInfo if still missing from intelligent heuristics
    const modelName = data.modelo || data.nombre || docId;
    const motor = data.motor || 'Estándar';
    const fuelInfo = getFuelTypeInfo(data, modelName, motor);
    if (!data.combustible) {
      data.combustible = fuelInfo.isDiesel ? 'diesel' : 'gasolina';
    }

    window.currentModelsDataStore[docId] = data;
    return { docId, data };
  }));

  if (cacheKey) {
    window._modelsCacheByBrand[cacheKey] = modelEntries;
  }

  if (loader && typeof loader.finish === 'function') {
    loader.finish(() => {
      renderModelEntries(modelEntries, brandName, modelsListGrid);
    });
  } else {
    renderModelEntries(modelEntries, brandName, modelsListGrid);
  }
}

function renderModelEntries(modelEntries, brandName, modelsListGrid) {
  modelsListGrid.innerHTML = '';

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
    const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
      ? window.isProbaktronicAdmin() 
      : (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin' || window.probaktronicCurrentUser.isAdmin === true));

    const adminAddBtnHtml = isAdmin ? `
      <div class="mt-4">
        <button class="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-sm font-rajdhani" onclick="openAdminAddModelModal('${brandName}')">
          <i class="bi bi-car-front-fill me-1"></i> + AGREGAR PRIMER MODELO A ${brandName.toUpperCase()}
        </button>
      </div>
    ` : '';

    modelsListGrid.innerHTML = `
      <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
        <div style="color: #DC2626; font-size: 2.5rem; margin-bottom: 10px;"><i class="bi bi-info-circle"></i></div>
        <h5 class="fw-bold text-dark">No hay modelos de ${currentSelectedFuelType ? currentSelectedFuelType.toUpperCase() : ''} disponibles</h5>
        <p class="text-muted small mb-2">No se encontraron modelos registrados en esta categoría para ${brandName}.</p>
        ${adminAddBtnHtml}
      </div>
    `;
    return;
  }

  filteredEntries.forEach(({ docId, data }) => {
    const modelName = data.modelo || data.nombre || docId;
    const motor = data.motor || 'Estándar';
    const fuelInfo = getFuelTypeInfo(data, modelName, motor);

    const carPhotoUrl = getVehicleCarPhotoUrl(brandName, modelName, docId) || data.fotoAuto || data.carPhoto || data.imagen;
    const thumbHtml = carPhotoUrl ? `
      <div class="model-car-thumb-wrap">
        <img src="${carPhotoUrl}" alt="${modelName}" class="model-car-thumb-img" onerror="this.parentElement.innerHTML='<div class=\\\'model-car-thumb-placeholder\\\'><i class=\\\'bi bi-question-lg\\\'></i></div>'">
      </div>
    ` : `
      <div class="model-car-thumb-wrap">
        <div class="model-car-thumb-placeholder"><i class="bi bi-question-lg"></i></div>
      </div>
    `;

    const isAdmin = (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email === 'prueba@probak.com');
    const editModelBtn = isAdmin ? `
      <button class="btn btn-sm btn-light rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center text-danger position-absolute top-0 end-0 m-2" style="width: 28px; height: 28px; z-index: 15;" title="Editar o Gestionar Modelo (Admin)" onclick="openAdminEditItemModal(event, 'model', { id: '${docId}', name: '${modelName}', brand: '${brandName}', motor: '${motor}', fuel: '${fuelInfo.isDiesel ? 'diesel' : 'gasolina'}' })">
        <i class="bi bi-pencil-fill" style="font-size: 11px;"></i>
      </button>
    ` : '';

    const card = document.createElement('div');
    card.className = 'model-item-card position-relative';
    card.innerHTML = `
      ${editModelBtn}
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

    // Admin Card: + AGREGAR MODELO
    const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
      ? window.isProbaktronicAdmin() 
      : (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin' || window.probaktronicCurrentUser.isAdmin === true));

    if (isAdmin) {
      const addModelCard = document.createElement('div');
      addModelCard.className = 'model-item-card border-dashed d-flex flex-column align-items-center justify-content-center text-center p-3 cursor-pointer';
      addModelCard.style.border = '2px dashed rgba(211, 47, 47, 0.45)';
      addModelCard.style.backgroundColor = 'rgba(211, 47, 47, 0.03)';
      addModelCard.style.minHeight = '140px';
      addModelCard.innerHTML = `
        <div class="text-danger mb-2">
          <i class="bi bi-car-front-fill fs-1"></i>
        </div>
        <h4 class="model-card-title text-danger fw-bold" style="font-size: 0.95rem;">+ AGREGAR MODELO</h4>
        <p class="model-card-subtitle text-muted small" style="font-size: 0.72rem;">Registrar nuevo modelo para ${brandName}</p>
      `;
      addModelCard.onclick = (e) => {
        if (e) e.stopPropagation();
        window.openAdminAddModelModal(brandName);
      };
      modelsListGrid.appendChild(addModelCard);
    }

    setupModelSearchFilter();
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

      const isAdmin = (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email === 'prueba@probak.com');
      const editModelBtn = isAdmin ? `
        <button class="btn btn-sm btn-light rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center text-danger position-absolute top-0 end-0 m-2" style="width: 28px; height: 28px; z-index: 15;" title="Editar o Gestionar Modelo (Admin)" onclick="openAdminEditItemModal(event, 'model', { id: '${m.id}', name: '${m.modelo}', brand: '${brandName}', motor: '${m.motor}', fuel: '${fuelInfo.isDiesel ? 'diesel' : 'gasolina'}' })">
          <i class="bi bi-pencil-fill" style="font-size: 11px;"></i>
        </button>
      ` : '';

      const card = document.createElement('div');
      card.className = 'model-item-card position-relative';
      card.innerHTML = `
        ${editModelBtn}
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

    // Admin Card: + AGREGAR MODELO
    const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
      ? window.isProbaktronicAdmin() 
      : (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin' || window.probaktronicCurrentUser.isAdmin === true));

    if (isAdmin) {
      const addModelCard = document.createElement('div');
      addModelCard.className = 'model-item-card border-dashed d-flex flex-column align-items-center justify-content-center text-center p-3 cursor-pointer';
      addModelCard.style.border = '2px dashed rgba(211, 47, 47, 0.45)';
      addModelCard.style.backgroundColor = 'rgba(211, 47, 47, 0.03)';
      addModelCard.style.minHeight = '140px';
      addModelCard.innerHTML = `
        <div class="text-danger mb-2">
          <i class="bi bi-car-front-fill fs-1"></i>
        </div>
        <h4 class="model-card-title text-danger fw-bold" style="font-size: 0.95rem;">+ AGREGAR MODELO</h4>
        <p class="model-card-subtitle text-muted small" style="font-size: 0.72rem;">Registrar nuevo modelo para ${brandName}</p>
      `;
      addModelCard.onclick = (e) => {
        if (e) e.stopPropagation();
        window.openAdminAddModelModal(brandName);
      };
      modelsListGrid.appendChild(addModelCard);
    }

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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }

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

  // Query subcollection 'archivos' from Firestore (Universal Case-Insensitive Deep Search)
  let archivosList = [];
  try {
    const db = firebase.firestore();
    const cleanBrand = (brandId || '').toLowerCase().trim();
    const cleanDoc = (docId || '').toLowerCase().trim();
    const cleanModel = (modelName || '').toLowerCase().trim();

    // 1. Fetch matching brand documents in collection 'diagramas'
    const allBrandsSnap = await db.collection('diagramas').get().catch(() => null);
    const matchingBrandDocs = [];

    if (allBrandsSnap && !allBrandsSnap.empty) {
      allBrandsSnap.forEach(bDoc => {
        const bId = bDoc.id.toLowerCase().trim();
        const bData = bDoc.data() || {};
        const bName = (bData.nombre || bData.marca || '').toLowerCase().trim();
        if (bId === cleanBrand || bName === cleanBrand || cleanBrand.includes(bId) || bId.includes(cleanBrand)) {
          matchingBrandDocs.push(bDoc);
        }
      });
    }

    if (matchingBrandDocs.length === 0) {
      const brandDirect = Array.from(new Set([brandId, cleanBrand, brandId.toUpperCase(), 'Toyota', 'toyota', 'TOYOTA']));
      for (const bd of brandDirect) {
        matchingBrandDocs.push(db.collection('diagramas').doc(bd));
      }
    }

    // 2. Traverse matching brand docs -> modelos -> anios -> motores -> archivos
    for (const bDocRef of matchingBrandDocs) {
      const bRef = bDocRef.ref || bDocRef;
      const bVar = bDocRef.id || brandId;

      try {
        const modelosSnap = await bRef.collection('modelos').get().catch(() => null);
        if (modelosSnap && !modelosSnap.empty) {
          for (const mDoc of modelosSnap.docs) {
            const mId = mDoc.id.toLowerCase().trim();
            const mData = mDoc.data() || {};
            const mName = (mData.modelo || mData.nombre || '').toLowerCase().trim();

            const isMatch = (
              mId === cleanDoc || mId === cleanModel ||
              cleanDoc.includes(mId) || mId.includes(cleanDoc) ||
              cleanModel.includes(mId) || mId.includes(cleanModel) ||
              (cleanDoc.includes('corolla') && mId.includes('corolla')) ||
              (cleanDoc.includes('hilux') && mId.includes('hilux')) ||
              (cleanDoc.includes('accent') && mId.includes('accent'))
            );

            if (isMatch) {
              const aniosSnap = await mDoc.ref.collection('anios').get().catch(() => null);
              if (aniosSnap && !aniosSnap.empty) {
                for (const anioDoc of aniosSnap.docs) {
                  const motoresSnap = await anioDoc.ref.collection('motores').get().catch(() => null);
                  if (motoresSnap && !motoresSnap.empty) {
                    for (const motorDoc of motoresSnap.docs) {
                      const archivosSnap = await motorDoc.ref.collection('archivos').get().catch(() => null);
                      if (archivosSnap && !archivosSnap.empty) {
                        archivosSnap.forEach(aDoc => {
                          const aData = aDoc.data() || {};
                          archivosList.push({
                            id: aDoc.id,
                            brandDocId: bVar,
                            modelDocId: mDoc.id,
                            anioDocId: anioDoc.id,
                            motorDocId: motorDoc.id,
                            archDocId: aDoc.id,
                            ...aData
                          });
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (errM) {}
    }
  } catch (e) {
    console.warn('Error querying archivos subcollection:', e);
  }

  // Filter out any deleted diagrams
  const deletedDiagrams = getDeletedItemsList('diagrams');
  archivosList = archivosList.filter(a => {
    const cleanId = (a.id || '').toLowerCase().trim();
    const cleanTitle = (a.titulo || a.nombre || '').toLowerCase().trim();
    return !deletedDiagrams.includes(cleanId) && !deletedDiagrams.includes(cleanTitle);
  });

  const isAdmin = (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin'));
  const btnNext = document.getElementById('btnNextToDiagram');

  // Fetch live global card icons from Firestore
  let firestoreCardIcons = {};
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const iconDoc = await firebase.firestore().collection('app_config').doc('iconos_tarjetas').get().catch(() => null);
      if (iconDoc && iconDoc.exists) {
        firestoreCardIcons = iconDoc.data() || {};
        try {
          const localSaved = JSON.parse(localStorage.getItem('probaktronic_card_icons') || '{}');
          localStorage.setItem('probaktronic_card_icons', JSON.stringify({ ...localSaved, ...firestoreCardIcons }));
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn('Could not fetch app_config/iconos_tarjetas:', e);
  }

  loader.finish(() => {
    connectionListContainer.innerHTML = '';

    if (archivosList.length === 0) {
      connectionListContainer.innerHTML = `
        <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
          <div class="bg-light rounded-circle p-3 d-inline-flex mb-2">
            <i class="bi bi-file-earmark-x text-danger" style="font-size: 2.5rem;"></i>
          </div>
          <h5 class="fw-bold text-dark mt-2 font-rajdhani">NO HAY DIAGRAMAS CARGADOS PARA ESTE MODELO</h5>
          <p class="text-muted small mb-3">Aún no se han subido esquemas o diagramas de conexión para este vehículo.</p>
          ${isAdmin ? `
            <button class="btn btn-danger btn-sm rounded-pill px-4 fw-bold shadow-sm" onclick="openAdminUploadModal()">
              <i class="bi bi-cloud-arrow-up-fill me-1"></i> Subir Primer Diagrama (Admin)
            </button>
          ` : ''}
        </div>
      `;
      if (btnNext) {
        btnNext.disabled = true;
        btnNext.classList.add('opacity-50');
      }
      return;
    }

    if (btnNext) {
      btnNext.disabled = false;
      btnNext.classList.remove('opacity-50');
    }

    let selectedArchDoc = archivosList[0];

    archivosList.forEach((arch, index) => {
      const isSelected = index === 0;
      const title = (arch.titulo || arch.nombre || arch.id).toUpperCase();
      const cardKey = arch.id || title;
      const safeKey = cardKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Check if Admin set a custom icon for this card key (Firestore first, then LocalStorage, then arch.icono)
      let customIcon = arch.icono || firestoreCardIcons[cardKey] || firestoreCardIcons[safeKey] || firestoreCardIcons[title] || firestoreCardIcons[safeTitle];
      if (!customIcon) {
        try {
          const savedCustomIcons = JSON.parse(localStorage.getItem('probaktronic_card_icons') || '{}');
          customIcon = savedCustomIcons[cardKey] || savedCustomIcons[safeKey] || savedCustomIcons[title] || savedCustomIcons[safeTitle];
        } catch (e) {}
      }

      let iconHtml = '<i class="bi bi-file-earmark-pdf-fill fs-1"></i>';
      if (customIcon) {
        if (customIcon.startsWith('bi-')) {
          iconHtml = `<i class="bi ${customIcon} fs-1"></i>`;
        } else if (customIcon.startsWith('http') || customIcon.includes('/') || customIcon.endsWith('.svg') || customIcon.endsWith('.png')) {
          iconHtml = `<img src="${customIcon}" alt="Icono" style="max-height: 48px; max-width: 48px; object-fit: contain;">`;
        }
      } else if (title.includes('PEDAL')) {
        iconHtml = '<img src="pedal_acelerador.png" alt="Pedal Acelerador APP" style="max-height: 48px; max-width: 48px; object-fit: contain;">';
      } else if (title.includes('OBD')) {
        iconHtml = '<i class="bi bi-hdd-network-fill fs-1"></i>';
      } else if (title.includes('BOOT')) {
        iconHtml = '<i class="bi bi-cpu-fill fs-1"></i>';
      } else if (title.includes('BENCH')) {
        iconHtml = '<i class="bi bi-motherboard-fill fs-1"></i>';
      } else if (title.includes('EDU') || title.includes('CONECTOR')) {
        iconHtml = '<i class="bi bi-diagram-3-fill fs-1"></i>';
      } else if (title.includes('INMOVILIZADOR') || title.includes('LLAVE')) {
        iconHtml = '<i class="bi bi-key-fill fs-1"></i>';
      } else if (title.includes('PDF') || title.includes('DOCUMENTO')) {
        iconHtml = '<i class="bi bi-file-earmark-pdf-fill fs-1"></i>';
      }

      const adminEditBtnHtml = isAdmin ? `
        <div class="position-absolute top-0 end-0 m-1 d-flex gap-1" style="z-index: 15;">
          <button class="btn btn-sm btn-light rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px;" title="Cambiar ícono de esta tarjeta" onclick="openAdminMechanicalIconPicker(event, '${cardKey}', { brandDocId: '${arch.brandDocId || ''}', modelDocId: '${arch.modelDocId || ''}', anioDocId: '${arch.anioDocId || ''}', motorDocId: '${arch.motorDocId || ''}', archDocId: '${arch.archDocId || arch.id || ''}' })">
            <i class="bi bi-star-fill text-danger" style="font-size: 10px;"></i>
          </button>
          <button class="btn btn-sm btn-light rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center text-danger" style="width: 26px; height: 26px;" title="Editar o Gestionar Diagrama (Admin)" onclick="openAdminEditItemModal(event, 'diagram', { id: '${arch.archDocId || ''}', name: '${title}', brand: '${arch.brandDocId || ''}', model: '${arch.modelDocId || ''}', anio: '${arch.anioDocId || ''}', motor: '${arch.motorDocId || ''}', fileUrl: '${arch.url || arch.imageUrl || ''}' })">
            <i class="bi bi-pencil-fill" style="font-size: 10px;"></i>
          </button>
        </div>
      ` : '';

      const card = document.createElement('div');
      card.className = `connection-type-card position-relative ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        ${adminEditBtnHtml}
        <div class="card-corner-badge">
          <i class="bi ${isSelected ? 'bi-check-circle-fill' : 'bi-slash-circle'}"></i>
        </div>
        <div class="conn-icon" data-icon-key="${cardKey}" data-icon-title="${title}">
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

    // Dedicated Admin Card: + Subir Diagrama a este vehículo
    if (isAdmin) {
      const addCard = document.createElement('div');
      addCard.className = 'connection-type-card border-dashed d-flex flex-column align-items-center justify-content-center text-center p-3 cursor-pointer';
      addCard.style.border = '2px dashed rgba(211, 47, 47, 0.45)';
      addCard.style.backgroundColor = 'rgba(211, 47, 47, 0.03)';
      addCard.style.minHeight = '120px';
      addCard.innerHTML = `
        <div class="conn-icon text-danger mb-2">
          <i class="bi bi-cloud-plus-fill fs-2"></i>
        </div>
        <div class="conn-label fw-bold text-danger" style="font-size: 0.84rem;">+ SUBIR DIAGRAMA</div>
        <div class="text-muted small" style="font-size: 0.7rem;">Agregar nuevo SVG/PDF a este vehículo</div>
      `;
      addCard.onclick = (ev) => {
        ev.stopPropagation();
        window.openAdminAddDiagramModal(ev, {
          brand: brandName,
          model: modelName || docId,
          motor: motorCode
        });
      };
      connectionListContainer.appendChild(addCard);
    }

    if (btnNext) {
      btnNext.onclick = () => {
        if (selectedArchDoc) {
          openDiagramViewer(docId, selectedArchDoc);
        }
      };
    }
  });
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

  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') ? window.isProbaktronicAdmin() : false;

  if (currentGalleryImages.length > 1 || (currentGalleryImages.length === 1 && isAdmin)) {
    paginationEl.classList.remove('d-none');
    if (prevBtn) {
      if (currentGalleryImages.length > 1) prevBtn.classList.remove('d-none');
      else prevBtn.classList.add('d-none');
    }
    if (nextBtn) {
      if (currentGalleryImages.length > 1) nextBtn.classList.remove('d-none');
      else nextBtn.classList.add('d-none');
    }

    const reorderBtnHtml = isAdmin ? `
      <button class="btn-photo-pill border border-warning text-warning fw-bold ms-2 shadow-sm" onclick="openAdminGalleryReorderModal(event)" title="Elegir y organizar el orden de las fotos">
        <i class="bi bi-arrow-down-up me-1"></i> Ordenar Fotos
      </button>
      <button class="btn-photo-pill border border-danger text-danger fw-bold ms-1 shadow-sm" onclick="openAdminAddPhotoDirectModal(event)" title="Subir y agregar una nueva foto a este componente">
        <i class="bi bi-cloud-arrow-up-fill me-1"></i> + Agregar Foto
      </button>
    ` : '';

    paginationEl.innerHTML = currentGalleryImages.map((_, idx) => `
      <button class="btn-photo-pill ${idx === 0 ? 'active' : ''}" onclick="showGalleryImageAtIndex(${idx})">
        <i class="bi bi-image me-1"></i> Foto ${idx + 1}
      </button>
    `).join('') + reorderBtnHtml;
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
      if (window.currentActiveDiagramSection === 'pcb') {
        window.initInteractiveEcuLayer();
      }
    };
    imgEl.src = currentGalleryImages[currentGalleryIndex];
    if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.width > 0)) {
      const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
      window.applyConsoleWatermark(isVert);
      if (window.currentActiveDiagramSection === 'pcb') {
        window.initInteractiveEcuLayer();
      }
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

  if (activeEcuComponentId && typeof window.positionActiveEcuDrawerAndLine === 'function') {
    const comp = currentEcuHotspots.find(c => c.id === activeEcuComponentId);
    if (comp) {
      window.positionActiveEcuDrawerAndLine(comp, window.getEcuComponentTheme(comp));
    }
  }
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

      // Activate interactive ECU layer & check Admin controls
      if (typeof window.initInteractiveEcuLayer === 'function') {
        window.initInteractiveEcuLayer();
      }
      if (typeof window.updateEcuAdminUI === 'function') {
        window.updateEcuAdminUI();
      }
    }
  } else {
    // Hide interactive ECU overlay on PDF/Connector mode
    if (typeof window.hideInteractiveEcuLayer === 'function') {
      window.hideInteractiveEcuLayer();
    }

    // 2. Conexionado del componente (PDF or Schematic Diagram)
    if (btnPcb) btnPcb.classList.remove('active');
    if (btnConn) btnConn.classList.add('active');
    if (titleEl) titleEl.textContent = `Conexionado ${comp.phrase}`;

    if (galleryPaginationEl) galleryPaginationEl.classList.add('d-none');
    if (prevGalleryBtn) prevGalleryBtn.classList.add('d-none');
    let stageLoader = document.getElementById('consoleDiagramStageLoader');
    if (!stageLoader) {
      stageLoader = document.createElement('div');
      stageLoader.id = 'consoleDiagramStageLoader';
      stageLoader.className = 'position-absolute top-50 start-50 translate-middle text-center p-3 bg-white bg-opacity-75 rounded-3 shadow-sm';
      stageLoader.style.zIndex = '20';
      stageLoader.innerHTML = `
        <div class="spinner-border text-danger spinner-border-sm mb-1" role="status"></div>
        <div class="small fw-bold text-dark font-rajdhani" style="font-size: 0.75rem;">Cargando esquema...</div>
      `;
      const stageEl = document.getElementById('consoleDiagramStage');
      if (stageEl) stageEl.appendChild(stageLoader);
    }
    if (stageLoader) stageLoader.classList.remove('d-none');

    // Priority check for PDF schema / connector file
    const candidatePdfUrls = [
      active.pdfUrl,
      active._selectedArchDoc?.pdfUrl,
      active.diagramaUrl,
      active._selectedArchDoc?.diagramaUrl,
      active.archivoPdf,
      active._selectedArchDoc?.archivoPdf,
      active.archivoUrl,
      active._selectedArchDoc?.archivoUrl,
      active.url,
      active._selectedArchDoc?.url,
      active.downloadUrl
    ];

    let targetPdfOrImg = candidatePdfUrls.find(u => typeof u === 'string' && (u.toLowerCase().includes('.pdf') || u.toLowerCase().includes('%2epdf')));

    // If target is not a PDF, search in Firebase Storage for the matching vehicle PDF
    if (!targetPdfOrImg && typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
      try {
        const brand = (currentSelectedBrandName || currentSelectedBrandId || 'toyota').toUpperCase().trim();
        const model = (currentSelectedModelId || 'hilux').toLowerCase().trim();
        const storage = firebase.storage();
        
        const folderCandidates = [
          `diagramas/${brand}/${model}`,
          `diagramas/${brand}`,
          `diagramas`
        ];

        for (const fPath of folderCandidates) {
          const listRes = await storage.ref(fPath).listAll().catch(() => null);
          if (listRes) {
            // Check direct items in folder
            const pdfItem = listRes.items.find(item => item.name.toLowerCase().endsWith('.pdf'));
            if (pdfItem) {
              targetPdfOrImg = await pdfItem.getDownloadURL();
              active.pdfUrl = targetPdfOrImg;
              break;
            }
            // Check subfolders
            for (const prefix of listRes.prefixes) {
              const subList = await prefix.listAll().catch(() => null);
              if (subList) {
                const subPdf = subList.items.find(item => item.name.toLowerCase().endsWith('.pdf'));
                if (subPdf) {
                  targetPdfOrImg = await subPdf.getDownloadURL();
                  active.pdfUrl = targetPdfOrImg;
                  break;
                }
              }
            }
            if (targetPdfOrImg) break;
          }
        }
      } catch (errSearch) {
        console.warn('Storage PDF auto-discovery notice:', errSearch);
      }
    }

    if (!targetPdfOrImg) {
      targetPdfOrImg = active.pdfUrl || active.archivoUrl || active.diagramaUrl || active.url || active.downloadUrl || active.imageUrl || active.imagen;
    }

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

    // Accurate PDF check: must end with .pdf and not be an image
    const cleanUrlLower = (targetPdfOrImg || '').toLowerCase();
    const isImageExt = /\.(png|jpg|jpeg|webp|svg|gif|bmp)(\?|$)/i.test(cleanUrlLower);
    const isPdf = !isImageExt && (cleanUrlLower.includes('.pdf') || cleanUrlLower.includes('%2epdf'));

    window.currentActivePdfUrl = targetPdfOrImg;

    if (isPdf) {
      if (imgEl) imgEl.classList.add('d-none');

      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        pdfjsLib.getDocument({ url: targetPdfOrImg, withCredentials: false }).promise.then(pdfDoc => {
          if (stageLoader) stageLoader.classList.add('d-none');
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
          if (stageLoader) stageLoader.classList.add('d-none');
          console.warn('PDF.js canvas render error, fallback to viewer:', err);
          if (canvasEl) canvasEl.classList.add('d-none');
          if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
          if (frameEl) {
            frameEl.classList.remove('d-none');
            frameEl.src = `${targetPdfOrImg}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
          }
        });
      } else {
        if (stageLoader) stageLoader.classList.add('d-none');
        if (canvasEl) canvasEl.classList.add('d-none');
        if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
        if (frameEl) {
          frameEl.classList.remove('d-none');
          frameEl.src = `${targetPdfOrImg}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
        }
      }
      // Set horizontal watermark for PDFs
      window.applyConsoleWatermark(false);
    } else {
      // Direct instant image rendering
      if (frameEl) {
        frameEl.classList.add('d-none');
        frameEl.src = '';
      }
      if (canvasEl) canvasEl.classList.add('d-none');
      if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
      if (imgEl) {
        imgEl.classList.remove('d-none');
        imgEl.onload = () => {
          if (stageLoader) stageLoader.classList.add('d-none');
          const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
          window.applyConsoleWatermark(isVert);
        };
        imgEl.onerror = () => {
          if (stageLoader) stageLoader.classList.add('d-none');
        };
        imgEl.src = targetPdfOrImg;
        if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.width > 0)) {
          if (stageLoader) stageLoader.classList.add('d-none');
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

let isSpacePanning = false;
let lastViewerPanTime = 0;

function setupViewerDragPan() {
  const wrap = document.getElementById('consoleImgViewerWrap');
  if (!wrap || wrap.dataset.panSetup === 'true') return;
  wrap.dataset.panSetup = 'true';

  let isDown = false;
  let isMiddleDown = false;
  let startX = 0, startY = 0;
  let initialPanX = 0, initialPanY = 0;
  let hasMoved = false;

  // Spacebar pan shortcut
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      isSpacePanning = true;
      if (wrap) wrap.style.cursor = 'grab';
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      isSpacePanning = false;
      if (wrap) wrap.style.cursor = isEcuEditorMode ? 'crosshair' : 'grab';
    }
  });

  wrap.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('.console-gallery-pagination') || e.target.closest('.console-ecu-info-drawer') || e.target.closest('.console-ecu-editor-banner')) return;

    const isMiddle = (e.button === 1);
    const isLeftAndCanPan = (e.button === 0 && (!isEcuEditorMode || isSpacePanning));

    if (isMiddle || isLeftAndCanPan) {
      if (isMiddle) e.preventDefault();
      isDown = true;
      isMiddleDown = isMiddle;
      hasMoved = false;
      wrap.classList.add('grabbing');
      wrap.style.cursor = 'grabbing';
      startX = e.clientX;
      startY = e.clientY;
      initialPanX = currentPanX;
      initialPanY = currentPanY;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    isMiddleDown = false;
    wrap.classList.remove('grabbing');
    wrap.style.cursor = isEcuEditorMode ? (isSpacePanning ? 'grab' : 'crosshair') : 'grab';
    if (hasMoved) {
      lastViewerPanTime = Date.now();
      window.updateStageTransform(true);
    }
  });

  window.addEventListener('mousemove', (e) => {
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
    if (e.target.closest('button') || e.target.closest('.console-gallery-pagination') || e.target.closest('.console-ecu-info-drawer') || e.target.closest('.console-ecu-editor-banner')) return;
    if (e.touches.length === 1 && !isEcuEditorMode) {
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
      wrap.classList.remove('grabbing');
      if (hasMoved) {
        lastViewerPanTime = Date.now();
        window.updateStageTransform(true);
      }
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

  const btnAdmin = document.getElementById('btnAdminAddDiagram');
  if (btnAdmin) btnAdmin.classList.add('d-none');

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
    const fileUrl = selectedArchDoc.url || selectedArchDoc.archivoUrl || selectedArchDoc.pdfUrl || selectedArchDoc.downloadUrl || selectedArchDoc.imageUrl || selectedArchDoc.imagen;
    if (fileUrl) {
      activeData.url = fileUrl;
    }
    if (selectedArchDoc.pdfUrl) {
      activeData.pdfUrl = selectedArchDoc.pdfUrl;
    } else if (fileUrl && (fileUrl.toLowerCase().includes('.pdf') || fileUrl.toLowerCase().includes('%2epdf'))) {
      activeData.pdfUrl = fileUrl;
    }
    if (Array.isArray(selectedArchDoc.imagenes) && selectedArchDoc.imagenes.length > 0) {
      activeData.allImages = selectedArchDoc.imagenes;
      activeData.imageUrl = selectedArchDoc.imagenes[0];
    } else if (selectedArchDoc.imageUrl) {
      activeData.imageUrl = selectedArchDoc.imageUrl;
    }
    activeData._selectedArchDoc = selectedArchDoc;
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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }

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
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (fuelView) fuelView.classList.add('d-none');
  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }

  if (fuelType === 'diesel') {
    if (dieselCatView) dieselCatView.classList.remove('d-none');
    if (gasCatView) gasCatView.classList.add('d-none');
    updateBreadcrumbUI('fuel_type', 'Diesel');

    const headerTitle = document.getElementById('vehiculosHeaderTitle');
    const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
    if (headerTitle) headerTitle.textContent = 'CATEGORÍAS DIÉSEL';
    if (headerSubtitle) headerSubtitle.textContent = 'Seleccione la categoría de vehículo o maquinaria Diésel a diagnosticar';
  } else {
    if (gasCatView) gasCatView.classList.remove('d-none');
    if (dieselCatView) dieselCatView.classList.add('d-none');
    updateBreadcrumbUI('fuel_type', 'Gasolina');

    const headerTitle = document.getElementById('vehiculosHeaderTitle');
    const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
    if (headerTitle) headerTitle.textContent = 'CATEGORÍAS GASOLINA';
    if (headerSubtitle) headerSubtitle.textContent = 'Seleccione el segmento de vehículo Gasolina a diagnosticar';
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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }

  updateBreadcrumbUI('category', fuelType === 'diesel' ? 'Diesel' : 'Gasolina', catTitle);

  const headerTitle = document.getElementById('vehiculosHeaderTitle');
  const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
  if (headerTitle) headerTitle.textContent = `MARCAS ${catTitle}`;
  if (headerSubtitle) headerSubtitle.textContent = `Seleccione la marca de ${catTitle} (${fuelType.toUpperCase()}) para ver modelos y diagramas`;
};

function updateBreadcrumbUI(level, fuelLabel = '', catLabel = '') {
  const nav = document.getElementById('vehicleBreadcrumbNav');
  const sep1 = document.getElementById('bcrumbSep1');
  const bFuel = document.getElementById('bcrumbFuelType');
  const sep2 = document.getElementById('bcrumbSep2');
  const bCat = document.getElementById('bcrumbCategory');

  if (level === 'fuel') {
    if (nav) {
      nav.classList.add('d-none');
      nav.classList.remove('d-flex');
    }
    if (sep1) sep1.classList.add('d-none');
    if (bFuel) bFuel.classList.add('d-none');
    if (sep2) sep2.classList.add('d-none');
    if (bCat) bCat.classList.add('d-none');
  } else if (level === 'fuel_type') {
    if (nav) {
      nav.classList.remove('d-none');
      nav.classList.add('d-flex');
    }
    if (sep1) sep1.classList.remove('d-none');
    if (bFuel) {
      bFuel.classList.remove('d-none');
      bFuel.textContent = fuelLabel;
    }
    if (sep2) sep2.classList.add('d-none');
    if (bCat) bCat.classList.add('d-none');
  } else if (level === 'category') {
    if (nav) {
      nav.classList.remove('d-none');
      nav.classList.add('d-flex');
    }
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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }

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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }
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

  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }
};

let pdfResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(pdfResizeTimer);
  pdfResizeTimer = setTimeout(() => {
    const canvas = document.getElementById('consolePdfCanvas');
    if (currentPdfDoc && canvas && !canvas.classList.contains('d-none')) {
      window.renderPdfPageOnCanvas(currentPdfPageNum);
    }

    if (window.innerWidth <= 768) {
      if (typeof window.hideInteractiveEcuLayer === 'function') {
        window.hideInteractiveEcuLayer();
      }
    } else if (window.currentActiveDiagramSection === 'pcb') {
      if (typeof window.initInteractiveEcuLayer === 'function') {
        window.initInteractiveEcuLayer();
      }
    }
  }, 150);
});

// --- ADMIN MECHANICAL ICON PICKER FOR CONNECTION CARDS ---
let currentEditingCardKey = '';
let currentEditingCardArchContext = null;
let selectedMechanicalIconChoice = '';

window.openAdminMechanicalIconPicker = function(e, cardKey, archContext = null) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  currentEditingCardKey = cardKey;
  currentEditingCardArchContext = archContext;
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

window.saveAdminMechanicalIconChoice = async function() {
  const customInput = document.getElementById('adminCustomIconInput');
  if (customInput && customInput.value.trim()) {
    selectedMechanicalIconChoice = customInput.value.trim();
  }

  if (!currentEditingCardKey || !selectedMechanicalIconChoice) {
    alert('Por favor seleccione un ícono para aplicar.');
    return;
  }

  // 1. Guardado inmediato en LocalStorage (Caché local)
  try {
    const saved = JSON.parse(localStorage.getItem('probaktronic_card_icons') || '{}');
    saved[currentEditingCardKey] = selectedMechanicalIconChoice;
    const safeKey = currentEditingCardKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    saved[safeKey] = selectedMechanicalIconChoice;
    localStorage.setItem('probaktronic_card_icons', JSON.stringify(saved));
  } catch (e) {}

  // 2. Aplicar inmediatamente al DOM actual
  applyCustomIconToKey(currentEditingCardKey, selectedMechanicalIconChoice);

  // 3. Guardado directo en el documento del diagrama en Firestore
  try {
    ensureFirebaseInitialized();
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();

      if (currentEditingCardArchContext && currentEditingCardArchContext.archDocId) {
        const { brandDocId, modelDocId, anioDocId, motorDocId, archDocId } = currentEditingCardArchContext;
        if (brandDocId && modelDocId && anioDocId && motorDocId && archDocId) {
          const cleanBrand = brandDocId.toLowerCase().trim();
          const cleanModel = modelDocId.toLowerCase().trim();
          await db.collection('diagramas').doc(cleanBrand)
            .collection('modelos').doc(cleanModel)
            .collection('anios').doc(anioDocId)
            .collection('motores').doc(motorDocId)
            .collection('archivos').doc(archDocId)
            .set({ icono: selectedMechanicalIconChoice }, { merge: true });
          console.log('Icono guardado directamente en Firestore en el documento de diagrama:', archDocId);
        }
      }

      // 4. Guardado en app_config > iconos_tarjetas (Global fallback)
      const safeKey = currentEditingCardKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanKey = currentEditingCardKey.trim();
      const payload = {
        [cleanKey]: selectedMechanicalIconChoice,
        [safeKey]: selectedMechanicalIconChoice,
        [cleanKey.toUpperCase()]: selectedMechanicalIconChoice,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('app_config').doc('iconos_tarjetas').set(payload, { merge: true });
      console.log('Icono guardado exitosamente en Firestore app_config/iconos_tarjetas:', safeKey, selectedMechanicalIconChoice);
    }
  } catch (err) {
    console.error('Error guardando en Firestore:', err);
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`¡Ícono sincronizado en Firestore para "${currentEditingCardKey}"!`);
  }

  const modalEl = document.getElementById('adminMechanicalIconPickerModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();
  }
};

function injectAdminMechanicalIconPickerModal() {
  if (document.getElementById('adminMechanicalIconPickerModal')) return;

  const mechanicalIcons = [
    { title: 'Pedal Acelerador APP', icon: 'pedal_acelerador.png' },
    { title: 'Pedal Freno', icon: 'pedal_acelerador.png' },
    { title: 'ECU Computadora ECM', icon: 'bi-cpu-fill' },
    { title: 'Pinout E.D.U Multipines', icon: 'bi-diagram-3-fill' },
    { title: 'Inmovilizador / Llave', icon: 'bi-key-fill' },
    { title: 'Drivers IGBT / Placa', icon: 'bi-motherboard-fill' },
    { title: 'Surtidor Gasolina', icon: 'bi-fuel-pump-fill' },
    { title: 'Gota Diésel / Aceite', icon: 'bi-droplet-fill' },
    { title: 'Camioneta Pickup', icon: 'bi-truck-front-fill' },
    { title: 'Furgón / Van Carga', icon: 'bi-box-seam-fill' },
    { title: 'Camión Pesado', icon: 'bi-truck' },
    { title: 'Maquinaria Pesada', icon: 'bi-gear-wide-connected' },
    { title: 'Sedán / Auto Liviano', icon: 'bi-car-front-fill' },
    { title: 'SUV / Crossover 4x4', icon: 'bi-shield-shaded' },
    { title: 'Cuerpo Acelerador TPS', icon: 'bi-circle-half' },
    { title: 'Bomba Inyección Diésel', icon: 'bi-fuel-pump' },
    { title: 'Inyectores Common Rail', icon: 'bi-layers-fill' },
    { title: 'Bobina / Chispa', icon: 'bi-lightning-charge-fill' },
    { title: 'Batería 12V / 24V', icon: 'bi-battery-charging' },
    { title: 'Bujía / Precalentador', icon: 'bi-lightning-fill' },
    { title: 'Turbocompresor / Turbo', icon: 'bi-fan' },
    { title: 'Válvula EGR / Emisiones', icon: 'bi-recycle' },
    { title: 'Sensor MAF Flujómetro', icon: 'bi-wind' },
    { title: 'Sensor MAP Presión', icon: 'bi-speedometer' },
    { title: 'Sensor CKP / Cigüeñal', icon: 'bi-arrow-repeat' },
    { title: 'Sensor CMP / Levas', icon: 'bi-arrow-clockwise' },
    { title: 'Sensor Oxígeno / Lambda', icon: 'bi-activity' },
    { title: 'Termostato / ECT Temp', icon: 'bi-thermometer-high' },
    { title: 'Alternador & Generador', icon: 'bi-arrow-left-right' },
    { title: 'Motor de Arranque', icon: 'bi-power' },
    { title: 'Fusibles & Relés BCM', icon: 'bi-toggle-on' },
    { title: 'Frenos ABS / Control ESP', icon: 'bi-record-circle' },
    { title: 'Transmisión / Caja TCM', icon: 'bi-gear-fill' },
    { title: 'Palanca de Cambios', icon: 'bi-diagram-2-fill' },
    { title: 'Amortiguador / Suspensión', icon: 'bi-bounding-box-circles' },
    { title: 'Aceitera & Lubricación', icon: 'bi-droplet-half' },
    { title: 'Volante / Dirección EPS', icon: 'bi-disc-fill' },
    { title: 'Velocímetro / Scanner', icon: 'bi-speedometer2' },
    { title: 'Red OBD-II / CAN Bus', icon: 'bi-hdd-network-fill' },
    { title: 'Herramientas Mecánico', icon: 'bi-wrench-adjustable' },
    { title: 'Mecánico con Llave', icon: 'bi-person-gear' },
    { title: 'Seguridad / Alarma', icon: 'bi-shield-lock-fill' },
    { title: 'Documento / Esquema PDF', icon: 'bi-file-earmark-pdf-fill' },
    { title: 'Estrella / Favorito', icon: 'bi-star-fill' },
    { title: 'Escudo Probaktronic', icon: 'bi-shield-check' }
  ];

  const iconChoicesHtml = mechanicalIcons.map(item => {
    const isImg = item.icon.endsWith('.png') || item.icon.endsWith('.svg') || item.icon.includes('/');
    const iconVisual = isImg
      ? `<img src="${item.icon}" alt="${item.title}" style="max-height: 32px; max-width: 32px; object-fit: contain; margin-bottom: 2px;">`
      : `<i class="bi ${item.icon} fs-3"></i>`;

    return `
      <button type="button" class="btn btn-outline-dark btn-mech-icon-choice p-2 text-center" data-icon="${item.icon}" title="${item.title}" style="width: 82px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px;">
        ${iconVisual}
        <span style="font-size: 8px; line-height: 1.1; margin-top: 4px; max-width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</span>
      </button>
    `;
  }).join('');

  const modalHtml = `
    <div class="modal fade" id="adminMechanicalIconPickerModal" tabindex="-1" aria-labelledby="adminMechanicalIconPickerModalLabel" aria-hidden="true" style="z-index: 1070;">
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
              Selecciona el nuevo ícono representativo para: <strong id="adminIconCardTitle" class="text-danger">TARJETA</strong>
            </div>

            <!-- Mechanical & Electronic Icons Grid -->
            <label class="form-label font-rajdhani fw-bold text-dark mb-2">Seleccione el ícono automotriz / mecánico:</label>
            <div class="d-flex align-items-center justify-content-center gap-2 flex-wrap mb-4" id="mechIconsContainer">
              ${iconChoicesHtml}
            </div>

            <!-- Custom URL or SVG -->
            <div class="mb-3">
              <label for="adminCustomIconInput" class="form-label font-rajdhani fw-bold text-dark mb-1">O ingrese una clase Bootstrap Icons (ej: bi-tools) o ruta de imagen:</label>
              <input type="text" class="form-control form-control-sm" id="adminCustomIconInput" placeholder="Ej: bi-sliders2, bi-cpu-fill, o imagenes svg/ico_logo_toyota.svg">
            </div>

          </div>
          <div class="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold" onclick="saveAdminMechanicalIconChoice()">
              <i class="bi bi-check-lg me-1"></i> Aplicar y Guardar Ícono
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

function applyCustomIconToKey(key, iconValue) {
  if (!key || !iconValue) return;
  const cleanKey = key.toLowerCase().trim();
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  const targetElements = document.querySelectorAll('[data-icon-key]');
  targetElements.forEach(el => {
    const elKey = (el.getAttribute('data-icon-key') || '').toLowerCase().trim();
    const elTitle = (el.getAttribute('data-icon-title') || '').toLowerCase().trim();
    const safeElKey = elKey.replace(/[^a-zA-Z0-9_-]/g, '_');

    const isMatch = (
      elKey === cleanKey || elTitle === cleanKey ||
      safeElKey === safeKey ||
      cleanKey.includes(elKey) || elKey.includes(cleanKey) ||
      (elTitle && (cleanKey.includes(elTitle) || elTitle.includes(cleanKey)))
    );

    if (isMatch) {
      if (iconValue.startsWith('bi-')) {
        el.innerHTML = `<i class="bi ${iconValue} fs-1"></i>`;
      } else if (iconValue.endsWith('.png') || iconValue.endsWith('.svg') || iconValue.includes('/') || iconValue.startsWith('http')) {
        el.innerHTML = `<img src="${iconValue}" alt="${key}" style="max-height: 48px; max-width: 48px; object-fit: contain;">`;
      } else {
        el.innerHTML = `<i class="bi ${iconValue} fs-1"></i>`;
      }
    }
  });
}

let cardIconsFirestoreUnsubscribe = null;

function applyAllCustomCardIcons() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('probaktronic_card_icons') || '{}');
  } catch (e) {}

  Object.entries(saved).forEach(([key, iconVal]) => {
    applyCustomIconToKey(key, iconVal);
  });

  // Suscripción en Tiempo Real (Real-time Live Listener onSnapshot) con Firestore
  if (typeof firebase !== 'undefined' && firebase.firestore && !cardIconsFirestoreUnsubscribe) {
    const db = firebase.firestore();
    cardIconsFirestoreUnsubscribe = db.collection('app_config').doc('iconos_tarjetas').onSnapshot(doc => {
      if (doc.exists) {
        const firestoreIcons = doc.data() || {};
        try {
          const merged = { ...saved, ...firestoreIcons };
          localStorage.setItem('probaktronic_card_icons', JSON.stringify(merged));
        } catch (e) {}
        Object.entries(firestoreIcons).forEach(([k, v]) => {
          applyCustomIconToKey(k, v);
        });
      }
    }, err => {
      console.warn('Firestore card icons real-time listener error:', err);
    });
  }
}

function checkAdminCardIconButtonsVisibility() {
  const user = window.probaktronicCurrentUser;
  const isAdmin = user && (user.email === 'prueba@probak.com');
  const editButtons = document.querySelectorAll('.admin-card-icon-edit-btn');
  editButtons.forEach(btn => {
    if (isAdmin) {
      btn.classList.remove('d-none');
    } else {
      btn.classList.add('d-none');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyAllCustomCardIcons();
  checkAdminCardIconButtonsVisibility();
});

if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(() => {
    checkAdminCardIconButtonsVisibility();
    applyAllCustomCardIcons();
  });
}

window.openAdminAddDiagramModal = function(e, context = null) {
  if (e) e.preventDefault();

  const user = window.probaktronicCurrentUser;
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
    ? window.isProbaktronicAdmin() 
    : (user && (user.email === 'prueba@probak.com' || user.rol === 'admin' || user.isAdmin === true));

  if (!isAdmin) {
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('Acceso exclusivo para el Administrador del sistema.');
    } else {
      alert('Acceso exclusivo para el Administrador del sistema.');
    }
    return;
  }

  // Pre-fill inputs based on context or current screen
  const brandInput = document.getElementById('adminModalBrandInput');
  const modelInput = document.getElementById('adminModalModelInput');
  const yearInput = document.getElementById('adminModalYearInput');
  const motorInput = document.getElementById('adminModalMotorInput');
  const titleInput = document.getElementById('adminModalDiagramTitleInput');

  const ecuView = document.getElementById('ecuInfoViewContainer');
  const isEcuViewActive = ecuView && !ecuView.classList.contains('d-none');

  let curBrand = (context && context.brand) || currentSelectedBrandName || (isEcuViewActive ? document.getElementById('selectedVehicleBrandText')?.textContent : '') || '';
  let curModelRaw = (context && context.model) || (isEcuViewActive ? document.getElementById('selectedVehicleModelText')?.textContent : '') || '';
  let curMotor = (context && context.motor) || (isEcuViewActive ? document.getElementById('selectedVehicleSpecText')?.textContent : '') || '';

  // Extract year range if present in model string (e.g. "HILUX 2011 - 2015" or "2011 - 2015")
  let extractedYears = '';
  let extractedModel = curModelRaw;
  const yearMatch = curModelRaw.match(/(\d{4}\s*-\s*\d{4}|\d{4})/);
  if (yearMatch) {
    extractedYears = yearMatch[0].trim();
    extractedModel = curModelRaw.replace(yearMatch[0], '').trim();
  }

  if (brandInput && curBrand) brandInput.value = curBrand.toUpperCase().trim();
  if (modelInput && extractedModel) modelInput.value = extractedModel.trim();
  if (yearInput && extractedYears) yearInput.value = extractedYears;
  if (motorInput && curMotor && curMotor !== 'Estándar') motorInput.value = curMotor.trim();

  // Set Fuel Type & Category
  const fuel = (context && context.fuel) || currentSelectedFuelType || 'diesel';
  window.setAdminModalFuel(fuel);

  if (currentSelectedCategoryKey) {
    const catSelect = document.getElementById('adminModalCategorySelect');
    if (catSelect) catSelect.value = currentSelectedCategoryKey;
  }

  // Pre-fill suggested diagram title
  if (titleInput) {
    const b = (brandInput ? brandInput.value : '').trim();
    const m = (modelInput ? modelInput.value : '').trim();
    const y = (yearInput ? yearInput.value : '').trim();
    const mot = (motorInput ? motorInput.value : '').trim();
    const parts = [b, m, y, mot].filter(Boolean);
    if (parts.length > 0) {
      titleInput.value = `${parts.join(' ')} ECU`.trim();
    }
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
  const motor = (document.getElementById('adminModalMotorInput')?.value || '').trim();
  const titleInput = document.getElementById('adminModalDiagramTitleInput');

  const parts = [brand, model, year].filter(Boolean);
  let base = parts.join(' ');
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
    const modelDocId = rawModel.toLowerCase().trim();
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

        const metadata = {
          contentType: adminSelectedDiagramFile.type || (cleanFileName.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : undefined)
        };

        if (progressBar) progressBar.style.width = '50%';
        const uploadSnapshot = await fileRef.put(adminSelectedDiagramFile, metadata);
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

// Check admin button visibility on Auth change and current active view
window.checkAdminButtonVisibility = function() {
  const btn = document.getElementById('btnAdminAddDiagram');
  if (!btn) return;
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
    ? window.isProbaktronicAdmin() 
    : (window.probaktronicCurrentUser && (window.probaktronicCurrentUser.email === 'prueba@probak.com' || window.probaktronicCurrentUser.rol === 'admin' || window.probaktronicCurrentUser.isAdmin === true));
  
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const isEcuViewActive = ecuView && !ecuView.classList.contains('d-none');

  // ONLY display when viewing the specific vehicle's connection/diagram cards
  if (isAdmin && isEcuViewActive) {
    btn.classList.remove('d-none');
  } else {
    btn.classList.add('d-none');
  }
};

document.addEventListener('DOMContentLoaded', window.checkAdminButtonVisibility);
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(() => {
    if (typeof window.checkAdminButtonVisibility === 'function') {
      window.checkAdminButtonVisibility();
    }
  });
}

// --- ADMIN DELETE DIAGRAM / FILE CONTROLLER ---
window.handleAdminDeleteDiagramFile = async function(e, brandDocId, modelDocId, anioDocId, motorDocId, archDocId, diagramTitle, fileUrl) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const user = window.probaktronicCurrentUser;
  if (!user || user.email !== 'prueba@probak.com') {
    alert('Acceso exclusivo para el Administrador.');
    return;
  }

  const confirmDelete = confirm(`¿Está seguro de eliminar el diagrama/documento "${diagramTitle}"?\n\nEsta acción borrará el archivo de Firestore y Storage de forma segura sin afectar el resto de la base de datos ni la app de Android Studio.`);
  if (!confirmDelete) return;

  try {
    ensureFirebaseInitialized();
    const db = firebase.firestore();

    // 1. Delete from Firebase Storage if URL is available
    if (fileUrl && fileUrl.startsWith('http') && typeof firebase.storage === 'function') {
      try {
        const storageRef = firebase.storage().refFromURL(fileUrl);
        await storageRef.delete();
        console.log('Archivo de Storage eliminado con éxito');
      } catch (stErr) {
        console.warn('Nota Storage al eliminar:', stErr);
      }
    }

    // 2. Delete specific document in Firestore
    if (brandDocId && modelDocId && anioDocId && motorDocId && archDocId) {
      await db.collection('diagramas').doc(brandDocId.toLowerCase().trim())
        .collection('modelos').doc(modelDocId.toLowerCase().trim())
        .collection('anios').doc(anioDocId)
        .collection('motores').doc(motorDocId)
        .collection('archivos').doc(archDocId).delete();
    }

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast(`Diagrama "${diagramTitle}" eliminado exitosamente.`);
    } else {
      alert(`Diagrama "${diagramTitle}" eliminado exitosamente.`);
    }

    // 3. Reload current vehicle connection cards
    if (modelDocId) {
      window.openModelEcuInfo(modelDocId, modelDocId, motorDocId);
    } else {
      location.reload();
    }

  } catch (err) {
    console.error('Error al eliminar archivo:', err);
    alert('Ocurrió un error al eliminar el archivo: ' + err.message);
  }
};

// Recursive deletion helper for Firestore subcollections
async function deleteDocumentRecursively(docRef) {
  if (!docRef) return;
  const knownSubcollections = ['modelos', 'anios', 'motores', 'archivos'];
  for (const subName of knownSubcollections) {
    try {
      const snap = await docRef.collection(subName).get().catch(() => null);
      if (snap && !snap.empty) {
        for (const subDoc of snap.docs) {
          await deleteDocumentRecursively(subDoc.ref);
        }
      }
    } catch (e) {}
  }
  await docRef.delete().catch(() => {});
}

// --- ADMIN DELETE BRAND CONTROLLER ---
window.handleAdminDeleteBrand = async function(e, brandDocId, brandName) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const user = window.probaktronicCurrentUser;
  if (!user || user.email !== 'prueba@probak.com') {
    alert('Acceso exclusivo para el Administrador.');
    return;
  }

  const cleanBrand = (brandDocId || brandName).toLowerCase().trim();
  const upperBrand = (brandDocId || brandName).toUpperCase().trim();
  const titleBrand = brandName ? (brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()).trim() : '';

  // 1. Mark as deleted in local persistent storage & Firestore
  markItemAsDeleted('brands', cleanBrand);
  markItemAsDeleted('brands', upperBrand);
  if (brandName) {
    markItemAsDeleted('brands', brandName.toLowerCase().trim());
  }

  // 2. Remove card immediately from the DOM
  const brandGrid = document.getElementById('vehiculosBrandGrid');
  if (brandGrid) {
    const cards = brandGrid.querySelectorAll('.brand-card');
    cards.forEach(c => {
      const docAttr = (c.getAttribute('data-doc-id') || '').toLowerCase().trim();
      const nameAttr = (c.getAttribute('data-brand') || '').toLowerCase().trim();
      if (docAttr === cleanBrand || nameAttr === cleanBrand || (brandName && nameAttr === brandName.toLowerCase().trim())) {
        c.remove();
      }
    });
  }

  if (cachedActiveBrands) {
    cachedActiveBrands = cachedActiveBrands.filter(b => b.id.toLowerCase().trim() !== cleanBrand && b.name.toLowerCase().trim() !== cleanBrand);
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`Marca "${brandName}" eliminada exitosamente de Firestore.`);
  } else {
    alert(`Marca "${brandName}" eliminada exitosamente de Firestore.`);
  }

  // 3. Deep Recursive deletion of brand doc & all subcollections in Firestore
  try {
    ensureFirebaseInitialized();
    const db = firebase.firestore();

    const variants = Array.from(new Set([cleanBrand, upperBrand, titleBrand, brandDocId, brandName].filter(Boolean)));
    for (const bVar of variants) {
      const bRef = db.collection('diagramas').doc(bVar);
      await deleteDocumentRecursively(bRef);
    }

    // Refresh grid
    if (brandGrid) {
      loadFirestoreDiagramasBrands(brandGrid);
    }
  } catch (err) {
    console.error('Error al eliminar marca en Firestore:', err);
  }
};

// --- ADMIN DELETE MODEL CONTROLLER ---
window.handleAdminDeleteModel = async function(e, brandName, modelDocId, modelName) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const user = window.probaktronicCurrentUser;
  if (!user || user.email !== 'prueba@probak.com') {
    alert('Acceso exclusivo para el Administrador.');
    return;
  }

  const cleanBrand = (currentSelectedBrandId || brandName).toLowerCase().trim();
  const upperBrand = (currentSelectedBrandId || brandName).toUpperCase().trim();
  const cleanModel = modelDocId.toLowerCase().trim();
  const upperModel = modelDocId.toUpperCase().trim();

  // 1. Mark as deleted in local storage & Firestore
  markItemAsDeleted('models', cleanModel);
  if (modelName) markItemAsDeleted('models', modelName.toLowerCase().trim());

  // 2. Remove card immediately from the DOM
  const modelsListGrid = document.getElementById('brandModelsListGrid');
  if (modelsListGrid) {
    const cards = modelsListGrid.querySelectorAll('.model-item-card');
    cards.forEach(c => {
      const title = c.querySelector('.model-card-title')?.textContent.toLowerCase().trim();
      const subtitle = c.querySelector('.model-card-subtitle')?.textContent.toLowerCase().trim();
      if (title === cleanModel || subtitle === cleanModel || (modelName && subtitle === modelName.toLowerCase().trim())) {
        c.remove();
      }
    });
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`Modelo "${modelName}" eliminado exitosamente.`);
  } else {
    alert(`Modelo "${modelName}" eliminado exitosamente.`);
  }

  // 3. Deep Recursive deletion of model & its subcollections in Firestore
  try {
    ensureFirebaseInitialized();
    const db = firebase.firestore();

    const brandVars = Array.from(new Set([cleanBrand, upperBrand].filter(Boolean)));
    const modelVars = Array.from(new Set([cleanModel, upperModel, modelDocId, modelName].filter(Boolean)));

    for (const bVar of brandVars) {
      for (const mVar of modelVars) {
        const mRef = db.collection('diagramas').doc(bVar).collection('modelos').doc(mVar);
        await deleteDocumentRecursively(mRef);
      }
    }
  } catch (err) {
    console.error('Error al eliminar modelo en Firestore:', err);
  }
};

// --- ADMIN UNIVERSAL EDIT & MANAGE MODAL CONTROLLER ---
let currentEditingItemContext = null;

window.openAdminEditItemModal = function(e, type, itemData) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const user = window.probaktronicCurrentUser;
  if (!user || user.email !== 'prueba@probak.com') {
    alert('Acceso exclusivo para el Administrador.');
    return;
  }

  currentEditingItemContext = { type, ...itemData };

  const modalEl = document.getElementById('adminEditItemModal');
  if (!modalEl) return;

  const titleEl = document.getElementById('adminEditItemModalLabel');
  const subtitleEl = document.getElementById('adminEditItemModalSubtitle');
  const nameInput = document.getElementById('adminEditItemNameInput');
  const nameLabel = document.getElementById('adminEditItemNameLabel');
  const motorWrap = document.getElementById('adminEditItemMotorWrap');
  const motorInput = document.getElementById('adminEditItemMotorInput');
  const fuelWrap = document.getElementById('adminEditItemFuelWrap');
  const fuelSelect = document.getElementById('adminEditItemFuelSelect');
  const statusMsg = document.getElementById('adminEditItemStatusMsg');

  if (statusMsg) statusMsg.textContent = '';

  document.getElementById('adminEditItemType').value = type;
  document.getElementById('adminEditItemId').value = itemData.id || '';
  document.getElementById('adminEditItemParentBrand').value = itemData.brand || '';
  document.getElementById('adminEditItemParentModel').value = itemData.model || '';
  document.getElementById('adminEditItemParentAnio').value = itemData.anio || '';
  document.getElementById('adminEditItemParentMotor').value = itemData.motor || '';
  document.getElementById('adminEditItemFileUrl').value = itemData.fileUrl || '';

  if (type === 'brand') {
    if (titleEl) titleEl.textContent = `GESTIONAR MARCA: ${itemData.name}`;
    if (subtitleEl) subtitleEl.textContent = 'Edita el nombre de la marca o elimínala de Firestore';
    if (nameLabel) nameLabel.textContent = 'NOMBRE DE LA MARCA';
    if (nameInput) nameInput.value = itemData.name || itemData.id;
    if (motorWrap) motorWrap.classList.add('d-none');
    if (fuelWrap) fuelWrap.classList.add('d-none');
  } else if (type === 'model') {
    if (titleEl) titleEl.textContent = `GESTIONAR MODELO: ${itemData.name}`;
    if (subtitleEl) subtitleEl.textContent = 'Edita los datos del modelo o elimínalo de Firestore';
    if (nameLabel) nameLabel.textContent = 'NOMBRE DEL MODELO';
    if (nameInput) nameInput.value = itemData.name || itemData.id;
    if (motorWrap) {
      motorWrap.classList.remove('d-none');
      if (motorInput) motorInput.value = itemData.motor || '';
    }
    if (fuelWrap) {
      fuelWrap.classList.remove('d-none');
      if (fuelSelect) fuelSelect.value = (itemData.fuel || 'gasolina').toLowerCase();
    }
  } else if (type === 'diagram') {
    if (titleEl) titleEl.textContent = `GESTIONAR DIAGRAMA: ${itemData.name}`;
    if (subtitleEl) subtitleEl.textContent = 'Modifica el título del diagrama o elimínalo de Firestore y Storage';
    if (nameLabel) nameLabel.textContent = 'TÍTULO DEL DIAGRAMA';
    if (nameInput) nameInput.value = itemData.name || itemData.id;
    if (motorWrap) motorWrap.classList.add('d-none');
    if (fuelWrap) fuelWrap.classList.add('d-none');
  }

  if (typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

window.handleAdminSaveItemChanges = async function(e) {
  if (e) e.preventDefault();

  const user = window.probaktronicCurrentUser;
  if (!user || user.email !== 'prueba@probak.com') {
    alert('Acceso exclusivo para el Administrador.');
    return;
  }

  const type = document.getElementById('adminEditItemType').value;
  const id = document.getElementById('adminEditItemId').value;
  const newName = document.getElementById('adminEditItemNameInput').value.trim();
  const parentBrand = document.getElementById('adminEditItemParentBrand').value;
  const parentModel = document.getElementById('adminEditItemParentModel').value;
  const parentAnio = document.getElementById('adminEditItemParentAnio').value;
  const parentMotor = document.getElementById('adminEditItemParentMotor').value;
  const motorVal = document.getElementById('adminEditItemMotorInput')?.value.trim();
  const fuelVal = document.getElementById('adminEditItemFuelSelect')?.value;
  const statusMsg = document.getElementById('adminEditItemStatusMsg');

  if (!newName) {
    alert('Por favor ingrese un nombre o título válido.');
    return;
  }

  try {
    ensureFirebaseInitialized();
    const db = firebase.firestore();
    if (statusMsg) {
      statusMsg.className = 'small text-center fw-bold text-danger mb-2';
      statusMsg.textContent = 'Guardando cambios en Firestore...';
    }

    if (type === 'brand') {
      const cleanBrand = id.toLowerCase().trim();
      await db.collection('diagramas').doc(cleanBrand).set({
        nombre: newName.toUpperCase(),
        marca: newName.toUpperCase()
      }, { merge: true });

      if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(`Marca actualizada a "${newName}".`);
      }
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('adminEditItemModal'))?.hide();
        const grid = document.getElementById('vehiculosBrandGrid');
        if (grid) loadFirestoreDiagramasBrands(grid);
      }, 600);

    } else if (type === 'model') {
      const cleanBrand = (parentBrand || currentSelectedBrandId || '').toLowerCase().trim();
      const cleanModel = id.toLowerCase().trim();

      await db.collection('diagramas').doc(cleanBrand).collection('modelos').doc(cleanModel).set({
        nombre: `${parentBrand} ${newName}`.toUpperCase(),
        modelo: newName,
        motor: motorVal || 'Estándar',
        combustible: fuelVal || 'gasolina'
      }, { merge: true });

      if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(`Modelo "${newName}" actualizado con éxito.`);
      }
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('adminEditItemModal'))?.hide();
        const modelsListGrid = document.getElementById('brandModelsListGrid');
        if (modelsListGrid) {
          const loader = safeCreateCenteredLoader(modelsListGrid, 'Actualizando lista de modelos...');
          db.collection('diagramas').doc(cleanBrand).collection('modelos').get()
            .then(snap => renderModelCardsFromSnapshot(snap, parentBrand, modelsListGrid, loader))
            .catch(() => renderFallbackModelsForBrand(cleanBrand, parentBrand, modelsListGrid, loader));
        }
      }, 600);

    } else if (type === 'diagram') {
      const cleanBrand = (parentBrand || '').toLowerCase().trim();
      const cleanModel = (parentModel || '').toLowerCase().trim();

      if (cleanBrand && cleanModel && parentAnio && parentMotor && id) {
        await db.collection('diagramas').doc(cleanBrand)
          .collection('modelos').doc(cleanModel)
          .collection('anios').doc(parentAnio)
          .collection('motores').doc(parentMotor)
          .collection('archivos').doc(id).set({
            titulo: newName
          }, { merge: true });
      }

      if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(`Título de diagrama actualizado a "${newName}".`);
      }
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('adminEditItemModal'))?.hide();
        if (cleanModel) {
          window.openModelEcuInfo(cleanModel, cleanModel, parentMotor);
        }
      }, 600);
    }

  } catch (err) {
    console.error('Error guardando cambios:', err);
    if (statusMsg) {
      statusMsg.className = 'small text-center fw-bold text-danger mb-2';
      statusMsg.textContent = `Error al guardar: ${err.message}`;
    }
  }
};

window.handleAdminTriggerDeleteFromModal = function() {
  if (!currentEditingItemContext) return;

  const { type, id, name, brand, model, anio, motor, fileUrl } = currentEditingItemContext;
  const modalEl = document.getElementById('adminEditItemModal');
  const bsModal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;

  if (type === 'brand') {
    if (confirm(`¿CONFIRMACIÓN DE SEGURIDAD:\n\n¿Está totalmente seguro de eliminar la marca "${name}" de Firestore?`)) {
      if (bsModal) bsModal.hide();
      window.handleAdminDeleteBrand(null, id, name);
    }
  } else if (type === 'model') {
    if (confirm(`¿CONFIRMACIÓN DE SEGURIDAD:\n\n¿Está totalmente seguro de eliminar el modelo "${name}" (${brand}) de Firestore?`)) {
      if (bsModal) bsModal.hide();
      window.handleAdminDeleteModel(null, brand, id, name);
    }
  } else if (type === 'diagram') {
    if (confirm(`¿CONFIRMACIÓN DE SEGURIDAD:\n\n¿Está totalmente seguro de eliminar el diagrama "${name}" de Firestore y Storage?`)) {
      if (bsModal) bsModal.hide();
      window.handleAdminDeleteDiagramFile(null, brand, model, anio, motor, id, name, fileUrl);
    }
  }
};

/* ==========================================================================
   PROBAKTRONIC INTERACTIVE ECU PCB VIEWER & ADMIN HOTSPOT MAPPER ENGINE
   ========================================================================== */

let currentEcuHotspots = [];
let activeEcuComponentId = null;
let editingEcuHotspotId = null;
let isEcuEditorMode = false;
let isEcuDrawing = false;
let currentEcuDrawShape = 'rect'; // 'rect' | 'lasso'
let ecuLassoPoints = [];
let ecuDrawStartX = 0;
let ecuDrawStartY = 0;
let tempEcuBoxData = null;
let currentEcuStorageKey = 'default_ecu_2kd';

window.setEcuDrawShape = function(shape) {
  currentEcuDrawShape = shape;
  const btnRect = document.getElementById('btnEcuDrawModeRect');
  const btnLasso = document.getElementById('btnEcuDrawModeLasso');
  const textEl = document.getElementById('ecuDrawInstructionText');

  if (shape === 'lasso') {
    if (btnRect) {
      btnRect.classList.remove('border-warning', 'text-warning', 'active');
      btnRect.classList.add('border-secondary', 'text-white-50');
    }
    if (btnLasso) {
      btnLasso.classList.remove('border-secondary', 'text-white-50');
      btnLasso.classList.add('border-info', 'text-info', 'active');
    }
    if (textEl) {
      textEl.innerHTML = '<i class="bi bi-brush-fill me-1 text-info"></i> <strong>Modo Zona Libre:</strong> Mantén presionado y rodea la etapa/circuito con curvas (ESC para cancelar)';
    }
  } else {
    if (btnRect) {
      btnRect.classList.remove('border-secondary', 'text-white-50');
      btnRect.classList.add('border-warning', 'text-warning', 'active');
    }
    if (btnLasso) {
      btnLasso.classList.remove('border-info', 'text-info', 'active');
      btnLasso.classList.add('border-secondary', 'text-white-50');
    }
    if (textEl) {
      textEl.innerHTML = '<i class="bi bi-pencil-fill me-1 text-warning"></i> <strong>Modo Chip:</strong> Arrastra sobre el chip para marcarlo (ESC para cancelar)';
    }
  }
};

// Standardized Automotive Color Habit Mapping for ECU Components (12 Categorías Profesionales)
const ECU_CATEGORY_THEMES = {
  'EEPROM / Memoria': {
    name: 'Memoria EEPROM / Flash',
    color: '#A855F7',
    glow: '#C084FC',
    fill: 'rgba(168, 85, 247, 0.18)',
    icon: 'bi-memory'
  },
  'Microprocesador': {
    name: 'Microprocesador / MCU',
    color: '#94A3B8',
    glow: '#CBD5E1',
    fill: 'rgba(148, 163, 184, 0.18)',
    icon: 'bi-cpu-fill'
  },
  'Inyectores': {
    name: 'Driver Inyectores',
    color: '#10B981',
    glow: '#34D399',
    fill: 'rgba(16, 185, 129, 0.18)',
    icon: 'bi-fuel-pump-fill'
  },
  'Bobinas': {
    name: 'Driver Bobinas / Ignición',
    color: '#EAB308',
    glow: '#FDE047',
    fill: 'rgba(234, 179, 8, 0.18)',
    icon: 'bi-lightning-charge-fill'
  },
  'Voltaje': {
    name: 'Regulador / Voltaje Power',
    color: '#EF4444',
    glow: '#F87171',
    fill: 'rgba(239, 68, 68, 0.18)',
    icon: 'bi-battery-charging'
  },
  'Diodos': {
    name: 'Diodos / Protección',
    color: '#06B6D4',
    glow: '#38BDF8',
    fill: 'rgba(6, 182, 212, 0.18)',
    icon: 'bi-shield-shaded'
  },
  'EFI': {
    name: 'Alimentación Principal EFI',
    color: '#2563EB',
    glow: '#60A5FA',
    fill: 'rgba(37, 99, 235, 0.20)',
    icon: 'bi-power'
  },
  'Driver Sensor': {
    name: 'Driver / Procesador de Sensores',
    color: '#F97316',
    glow: '#FB923C',
    fill: 'rgba(249, 115, 22, 0.18)',
    icon: 'bi-activity'
  },
  'Transistor': {
    name: 'Transistor / MOSFET SMD',
    color: '#F8FAFC',
    glow: '#FFFFFF',
    fill: 'rgba(248, 250, 252, 0.18)',
    icon: 'bi-diagram-3-fill'
  },
  'Resistencia': {
    name: 'Resistencia SMD / Shunt',
    color: '#D97706',
    glow: '#FBBF24',
    fill: 'rgba(217, 119, 6, 0.18)',
    icon: 'bi-slash-lg'
  },
  'Cristal': {
    name: 'Cristal Oscilador / Reloj',
    color: '#EC4899',
    glow: '#F472B6',
    fill: 'rgba(236, 72, 153, 0.18)',
    icon: 'bi-gem'
  },
  'Condensador': {
    name: 'Condensador / Filtro',
    color: '#14B8A6',
    glow: '#2DD4BF',
    fill: 'rgba(20, 184, 166, 0.18)',
    icon: 'bi-dash-lg'
  }
};
window.ECU_CATEGORY_THEMES = ECU_CATEGORY_THEMES;

const CATEGORY_ALIASES = {
  'Almacenamiento & Seguridad': 'EEPROM / Memoria',
  'Procesamiento Central': 'Microprocesador',
  'Actuadores de Potencia': 'Inyectores',
  'Alimentación Interna': 'Voltaje',
  'Comunicaciones': 'Diodos',
  'Sensores & Entradas': 'Driver Sensor',
  'Conexionado': 'Microprocesador'
};
window.CATEGORY_ALIASES = CATEGORY_ALIASES;

const ECU_FRIENDLY_TYPES = {
  'EEPROM / Memoria': 'MEMORIA EEPROM / FLASH',
  'Microprocesador': 'MICROPROCESADOR (MCU)',
  'Inyectores': 'DRIVER DE INYECTORES',
  'Bobinas': 'DRIVER DE BOBINAS / IGNICIÓN',
  'Voltaje': 'REGULADOR DE VOLTAJE',
  'Diodos': 'DIODOS / PROTECCIÓN',
  'EFI': 'ALIMENTACIÓN PRINCIPAL EFI',
  'Driver Sensor': 'DRIVER DE SENSORES',
  'Transistor': 'TRANSISTOR / MOSFET SMD',
  'Resistencia': 'RESISTENCIA SMD',
  'Cristal': 'CRISTAL OSCILADOR',
  'Condensador': 'CONDENSADOR SMD'
};
window.ECU_FRIENDLY_TYPES = ECU_FRIENDLY_TYPES;
// Robust Category Normalizer to guarantee zero-fail matching across all historical data & formats
window.normalizeEcuCategory = function(rawCat) {
  if (!rawCat || typeof rawCat !== 'string') return 'Microprocesador';
  const c = rawCat.trim();
  if (ECU_CATEGORY_THEMES[c]) return c;
  if (CATEGORY_ALIASES[c]) return CATEGORY_ALIASES[c];

  const lower = c.toLowerCase();
  if (lower.includes('eeprom') || lower.includes('flash') || lower.includes('memoria') || lower.includes('inmo') || lower.includes('almacenamiento') || lower.includes('eprom')) return 'EEPROM / Memoria';
  if (lower.includes('micro') || lower.includes('mcu') || lower.includes('procesador') || lower.includes('procesamiento')) return 'Microprocesador';
  if (lower.includes('inyector') || lower.includes('actuador') || lower.includes('potencia') || lower.includes('driver iny')) return 'Inyectores';
  if (lower.includes('bobina') || lower.includes('ignic') || lower.includes('chispa')) return 'Bobinas';
  if (lower.includes('voltaje') || lower.includes('regulador') || lower.includes('alimentac') || lower.includes('power')) return 'Voltaje';
  if (lower.includes('diodo') || lower.includes('comunic') || lower.includes('can') || lower.includes('redes') || lower.includes('transceiver')) return 'Diodos';
  if (lower.includes('efi') || lower.includes('rele') || lower.includes('relay')) return 'EFI';
  if (lower.includes('sensor') || lower.includes('ckp') || lower.includes('cmp') || lower.includes('entrada')) return 'Driver Sensor';
  if (lower.includes('transistor') || lower.includes('mosfet') || lower.includes('igbt')) return 'Transistor';
  if (lower.includes('resistencia') || lower.includes('shunt') || lower.includes('smd')) return 'Resistencia';
  if (lower.includes('cristal') || lower.includes('reloj') || lower.includes('clock') || lower.includes('oscilador')) return 'Cristal';
  if (lower.includes('condensador') || lower.includes('filtro') || lower.includes('capacit')) return 'Condensador';

  return 'Microprocesador';
};

window.onAdminEcuCategoryChange = function() {
  const catEl = document.getElementById('adminEcuCompCategory');
  const tipoEl = document.getElementById('adminEcuCompTipo');
  if (catEl && tipoEl) {
    const canonicalCat = window.normalizeEcuCategory(catEl.value);
    const friendly = ECU_FRIENDLY_TYPES[canonicalCat] || '';
    const currentVal = (tipoEl.value || '').trim().toUpperCase();
    if (!currentVal || Object.values(ECU_FRIENDLY_TYPES).includes(currentVal) || Object.keys(ECU_FRIENDLY_TYPES).includes(currentVal)) {
      tipoEl.value = friendly;
    }
  }
};

window.getEcuComponentTheme = function(comp) {
  if (!comp) {
    return {
      name: 'Componente',
      color: '#00F0FF',
      glow: '#00F0FF',
      fill: 'rgba(0, 240, 255, 0.16)',
      icon: 'bi-cpu-fill'
    };
  }

  const cat = window.normalizeEcuCategory(comp.category || comp.tipo || comp.name);

  if (comp.customColor && comp.customColor !== 'auto') {
    return {
      name: cat,
      color: comp.customColor,
      glow: comp.customColor,
      fill: comp.customColor + '26',
      icon: (ECU_CATEGORY_THEMES[cat] && ECU_CATEGORY_THEMES[cat].icon) || 'bi-cpu-fill'
    };
  }

  return ECU_CATEGORY_THEMES[cat] || {
    name: cat,
    color: '#00F0FF',
    glow: '#00F0FF',
    fill: 'rgba(0, 240, 255, 0.16)',
    icon: 'bi-cpu-fill'
  };
};

window.updateEcuColorPickerPreview = function() {
  const catEl = document.getElementById('adminEcuCompCategory');
  const colorEl = document.getElementById('adminEcuCompCustomColor');
  const previewEl = document.getElementById('adminEcuColorPreviewBox');
  if (!catEl) return;

  const cat = window.normalizeEcuCategory(catEl.value);
  const theme = ECU_CATEGORY_THEMES[cat] || { color: '#00F0FF', glow: '#00F0FF', fill: 'rgba(0,240,255,0.15)' };

  if (colorEl) {
    colorEl.value = theme.color;
  }
  if (previewEl) {
    const friendlyName = ECU_FRIENDLY_TYPES[cat] || cat;
    previewEl.style.backgroundColor = theme.fill;
    previewEl.style.borderColor = theme.color;
    previewEl.style.color = theme.glow;
    previewEl.textContent = `HÁBITO: ${friendlyName}`;
  }
};

// Check & Update Admin UI Controls
window.updateEcuAdminUI = function() {
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') ? window.isProbaktronicAdmin() : false;
  const toggleBtn = document.getElementById('btnAdminToggleEcuEditor');
  const undoBtn = document.getElementById('btnAdminUndoEcuHotspot');
  const editBtn = document.getElementById('btnAdminEditSelectedHotspot');
  const delBtn = document.getElementById('btnAdminDeleteSelectedHotspot');
  const reorderBtn = document.getElementById('btnAdminReorderGallery');
  const addPhotoBtn = document.getElementById('btnAdminAddPhotoToComponent');

  if (toggleBtn) {
    if (isAdmin && window.currentActiveDiagramSection === 'pcb') {
      toggleBtn.classList.remove('d-none');
      toggleBtn.classList.add('d-flex');
    } else {
      toggleBtn.classList.add('d-none');
      toggleBtn.classList.remove('d-flex');
    }
  }

  if (reorderBtn) {
    if (isAdmin && window.currentActiveDiagramSection === 'pcb') {
      reorderBtn.classList.remove('d-none');
      reorderBtn.classList.add('d-flex');
    } else {
      reorderBtn.classList.add('d-none');
      reorderBtn.classList.remove('d-flex');
    }
  }

  if (addPhotoBtn) {
    if (isAdmin && window.currentActiveDiagramSection === 'pcb') {
      addPhotoBtn.classList.remove('d-none');
      addPhotoBtn.classList.add('d-flex');
    } else {
      addPhotoBtn.classList.add('d-none');
      addPhotoBtn.classList.remove('d-flex');
    }
  }

  const lockBtn = document.getElementById('btnAdminLockEcuHotspots');
  if (lockBtn) {
    if (isAdmin && window.currentActiveDiagramSection === 'pcb') {
      lockBtn.classList.remove('d-none');
      lockBtn.classList.add('d-flex');
    } else {
      lockBtn.classList.add('d-none');
      lockBtn.classList.remove('d-flex');
    }
  }

  const exportBtn = document.getElementById('btnAdminExportEcuJson');
  if (exportBtn) {
    if (isAdmin && window.currentActiveDiagramSection === 'pcb') {
      exportBtn.classList.remove('d-none');
      exportBtn.classList.add('d-flex');
    } else {
      exportBtn.classList.add('d-none');
      exportBtn.classList.remove('d-flex');
    }
  }

  if (undoBtn) {
    if (isAdmin && window.currentActiveDiagramSection === 'pcb' && isEcuEditorMode) {
      undoBtn.classList.remove('d-none');
      undoBtn.classList.add('d-flex');
    } else {
      undoBtn.classList.add('d-none');
      undoBtn.classList.remove('d-flex');
    }
  }

  if (editBtn) {
    if (isAdmin && activeEcuComponentId) {
      editBtn.classList.remove('d-none');
    } else {
      editBtn.classList.add('d-none');
    }
  }

  if (delBtn) {
    if (isAdmin && activeEcuComponentId) {
      delBtn.classList.remove('d-none');
    } else {
      delBtn.classList.add('d-none');
    }
  }
};

// Explicit Lock and Save Hotspots Controller
window.lockAndSaveEcuHotspots = async function() {
  if (!currentEcuHotspots || currentEcuHotspots.length === 0) {
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('No hay componentes para asegurar.', 'warning');
    } else {
      alert('No hay componentes para asegurar.');
    }
    return;
  }
  await saveEcuHotspotsToStorage();
  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`🔒 ¡${currentEcuHotspots.length} áreas marcadas y aseguradas permanentemente!`);
  } else {
    alert(`🔒 ¡${currentEcuHotspots.length} áreas marcadas y aseguradas permanentemente!`);
  }
};

// Open Export JSON Modal for Codebase & GitHub permanence
window.openAdminExportEcuJsonModal = function() {
  const modalEl = document.getElementById('modalAdminExportEcuJson');
  const area = document.getElementById('adminExportEcuJsonArea');
  if (!modalEl || !area) return;

  const jsonStr = JSON.stringify(currentEcuHotspots || [], null, 2);
  area.value = jsonStr;

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Copy Export JSON to Clipboard
window.copyAdminExportEcuJson = function() {
  const area = document.getElementById('adminExportEcuJsonArea');
  if (!area) return;
  area.select();
  navigator.clipboard.writeText(area.value).then(() => {
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('📋 ¡JSON copiado al portapapeles! Puedes pegarlo en el código.');
    } else {
      alert('📋 ¡JSON copiado al portapapeles! Puedes pegarlo en el código.');
    }
  }).catch(() => {
    document.execCommand('copy');
    alert('📋 ¡JSON copiado!');
  });
};

// Generate Storage Document Key for current vehicle / ECU (locked per photo index)
function getActiveEcuStorageKey() {
  const brand = (window.currentSelectedBrandId || 'brand').toLowerCase();
  const model = (window.currentSelectedModelId || 'model').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const active = window._currentActiveDiagramData || {};
  const title = (active.tituloArchivo || active.motor || active.id || 'ecu').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const photoIdx = (typeof currentGalleryIndex === 'number') ? `_f${currentGalleryIndex}` : '_f0';
  return `ecu_hotspots_${brand}_${model}_${title}${photoIdx}`;
}

// Initialize Interactive ECU Layer
window.initInteractiveEcuLayer = async function() {
  // Mobile check: Disable interactive ECU hotspots on mobile view (<= 768px) temporarily
  if (window.innerWidth <= 768) {
    window.hideInteractiveEcuLayer();
    return;
  }

  const svg = document.getElementById('consoleEcuSvgOverlay');
  const img = document.getElementById('consoleMainDiagramImg');
  const legend = document.getElementById('consoleEcuColorLegend');
  if (!svg || !img) return;

  svg.classList.remove('d-none');
  if (legend) {
    legend.classList.remove('d-none');
    legend.style.display = 'flex';
  }

  currentEcuStorageKey = getActiveEcuStorageKey();

  // Set SVG ViewBox matching Image Natural Dimensions
  const imgW = img.naturalWidth || 1000;
  const imgH = img.naturalHeight || 1094;
  svg.setAttribute('viewBox', `0 0 ${imgW} ${imgH}`);

  // Load existing hotspots from Firestore or local defaults
  await loadEcuHotspotsFromStorage(imgW, imgH);

  // Auto-sync admin's local hotspots to Firestore in background
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') ? window.isProbaktronicAdmin() : (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email === 'prueba@probak.com');
  if (isAdmin && currentEcuHotspots.length > 0) {
    saveEcuHotspotsToStorage().catch(() => {});
  }

  // Attach SVG Drawing events if not already attached
  setupEcuSvgEventListeners(svg);

  // Update Admin Buttons visibility
  window.updateEcuAdminUI();
};

window.hideInteractiveEcuLayer = function() {
  const svg = document.getElementById('consoleEcuSvgOverlay');
  const drawer = document.getElementById('consoleEcuInfoDrawer');
  const banner = document.getElementById('consoleEcuEditorBanner');
  const toggleBtn = document.getElementById('btnAdminToggleEcuEditor');
  const undoBtn = document.getElementById('btnAdminUndoEcuHotspot');
  const legend = document.getElementById('consoleEcuColorLegend');

  if (svg) svg.classList.add('d-none');
  if (drawer) drawer.classList.add('d-none');
  if (banner) banner.classList.add('d-none');
  if (legend) legend.style.display = 'none';
  if (toggleBtn) {
    toggleBtn.classList.add('d-none');
    toggleBtn.classList.remove('d-flex', 'btn-warning');
    toggleBtn.classList.add('btn-outline-warning');
  }
  if (undoBtn) undoBtn.classList.add('d-none');

  isEcuEditorMode = false;
  isEcuDrawing = false;
  activeEcuComponentId = null;
  editingEcuHotspotId = null;
};

// Default Hilux 2KD Denso ECU Hotspots (3 main circuits)
function getDefaultHiluxHotspots(imgW = 1000, imgH = 1094) {
  const scaleX = imgW / 1000;
  const scaleY = imgH / 1094;

  return [
    {
      id: 'ecu_comp_mcu',
      name: 'Microcontrolador Principal (MCU)',
      code: 'DENSO / TOSHIBA 32-Bit QFP',
      category: 'Microprocesador',
      x: Math.round(580 * scaleX), y: Math.round(155 * scaleY),
      width: Math.round(220 * scaleX), height: Math.round(230 * scaleY),
      pinX: Math.round(690 * scaleX), pinY: Math.round(270 * scaleY),
      controla: 'Cerebro principal de la ECU. Procesa señales de sensores en tiempo real (CKP, CMP, MAP, Temperatura) y comanda el mapa de inyección y presión del Common Rail.',
      voltajes: 'VCC: 5.0V / Núcleo: 3.3V',
      fallas_comunes: 'Vehículo no arranca, sin comunicación con escáner OBD2 (Sin testigo Check Engine).',
      pines_clave: 'Alimentación: Pines 1, 32, 64 &bull; Cristal oscilador: 20MHz'
    },
    {
      id: 'ecu_comp_eeprom',
      name: 'Memoria Flash / EEPROM',
      code: '93C86 / 25Cxxx SPI',
      category: 'EEPROM / Memoria',
      x: Math.round(260 * scaleX), y: Math.round(170 * scaleY),
      width: Math.round(170 * scaleX), height: Math.round(130 * scaleY),
      pinX: Math.round(345 * scaleX), pinY: Math.round(235 * scaleY),
      controla: 'Almacena la codificación del inmovilizador (Llaves/Transponder), número VIN, kilometraje y mapas de calibración del motor.',
      voltajes: 'VCC: 5.0V en Pin 8',
      fallas_comunes: 'Error de inmovilizador (Luz de seguridad parpadea), bloqueo de arranque, códigos P1600 / B2799.',
      pines_clave: 'Pin 1: CS &bull; Pin 4: GND &bull; Pin 8: VCC 5V'
    },
    {
      id: 'ecu_comp_drivers',
      name: 'Driver Etapa Inyectores Common Rail',
      code: 'SE555 / MOSFET Driver Array',
      category: 'Inyectores',
      x: Math.round(235 * scaleX), y: Math.round(535 * scaleY),
      width: Math.round(170 * scaleX), height: Math.round(100 * scaleY),
      pinX: Math.round(320 * scaleX), pinY: Math.round(585 * scaleY),
      controla: 'Maneja la apertura y corte de los inyectores electrohidráulicos diésel mediante pulsos de alta corriente.',
      voltajes: 'Voltaje de disparo: 12V / Retorno señal GND controlada',
      fallas_comunes: 'Fallo de cilindro (Misfire), humo negro, códigos P0201, P0202, P0203, P0204.',
      pines_clave: 'Gate: PWM 5V &bull; Drain: Señal a Inyector'
    }
  ];
}

// Load from Firestore with fallback to LocalStorage (Seguro de Trazos & Bloqueo Persistente)
async function loadEcuHotspotsFromStorage(imgW, imgH) {
  currentEcuHotspots = [];

  const active = window._currentActiveDiagramData || {};
  const archDoc = active._selectedArchDoc || {};

  // 1. Check local storage first for custom user modifications
  const rawLocal = localStorage.getItem(currentEcuStorageKey) || localStorage.getItem('probaktronic_ecu_hotspots_master_' + currentEcuStorageKey);
  if (rawLocal) {
    try {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentEcuHotspots = parsed;
      }
    } catch (e) {}
  }

  // 2. Check if the diagram document in memory already had componentes_ecu
  if (currentEcuHotspots.length === 0 && Array.isArray(archDoc.componentes_ecu) && archDoc.componentes_ecu.length > 0) {
    currentEcuHotspots = archDoc.componentes_ecu;
  }

  // 3. Parallel Fetch across Firestore endpoints (Diagram doc, ecu_hotspots, ecu_interactive_hotspots)
  if (currentEcuHotspots.length === 0 && typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
    try {
      const db = firebase.firestore();
      const queries = [];

      if (archDoc.brandDocId && archDoc.modelDocId && archDoc.anioDocId && archDoc.motorDocId && archDoc.archDocId) {
        const cleanBrand = (archDoc.brandDocId || '').toLowerCase().trim();
        const cleanModel = (archDoc.modelDocId || '').toLowerCase().trim();
        queries.push(
          db.collection('diagramas').doc(cleanBrand)
            .collection('modelos').doc(cleanModel)
            .collection('anios').doc(archDoc.anioDocId)
            .collection('motores').doc(archDoc.motorDocId)
            .collection('archivos').doc(archDoc.archDocId).get()
            .then(snap => (snap && snap.exists && Array.isArray(snap.data().componentes_ecu) && snap.data().componentes_ecu.length > 0) ? snap.data().componentes_ecu : null)
            .catch(() => null)
        );
      }

      queries.push(
        db.collection('diagramas').doc('ecu_hotspots').collection('items').doc(currentEcuStorageKey).get()
          .then(snap => (snap && snap.exists && Array.isArray(snap.data().componentes) && snap.data().componentes.length > 0) ? snap.data().componentes : null)
          .catch(() => null)
      );

      queries.push(
        db.collection('ecu_interactive_hotspots').doc(currentEcuStorageKey).get()
          .then(snap => (snap && snap.exists && Array.isArray(snap.data().componentes) && snap.data().componentes.length > 0) ? snap.data().componentes : null)
          .catch(() => null)
      );

      const results = await Promise.all(queries);
      const found = results.find(r => Array.isArray(r) && r.length > 0);
      if (found) {
        currentEcuHotspots = found;
      }
    } catch (err) {
      console.warn('Firestore hotspots parallel read notice:', err);
    }
  }

  // 6. Default fallback for initial Hilux ECU only if absolutely no data exists
  if (currentEcuHotspots.length === 0) {
    currentEcuHotspots = getDefaultHiluxHotspots(imgW, imgH);
  }

  // Calibrate and lock proportional dimensions to ensure areas never shift
  currentEcuHotspots = currentEcuHotspots.map(c => {
    const srcW = c.baseWidth || 1000;
    const srcH = c.baseHeight || 1094;
    const pinX = (typeof c.pinX === 'number' && !isNaN(c.pinX)) ? c.pinX : Math.round(c.x + c.width / 2);
    const pinY = (typeof c.pinY === 'number' && !isNaN(c.pinY)) ? c.pinY : Math.round(c.y + c.height / 2);

    if (srcW !== imgW || srcH !== imgH) {
      const rx = imgW / srcW;
      const ry = imgH / srcH;

      let scaledPoints = c.points;
      let scaledPathD = c.pathD;
      if (Array.isArray(c.points) && c.points.length > 0) {
        scaledPoints = c.points.map(pt => ({ x: Math.round(pt.x * rx), y: Math.round(pt.y * ry) }));
        scaledPathD = 'M ' + scaledPoints.map(pt => `${pt.x} ${pt.y}`).join(' L ') + ' Z';
      }

      return {
        ...c,
        x: Math.round(c.x * rx),
        y: Math.round(c.y * ry),
        width: Math.round(c.width * rx),
        height: Math.round(c.height * ry),
        pinX: Math.round(pinX * rx),
        pinY: Math.round(pinY * ry),
        points: scaledPoints,
        pathD: scaledPathD,
        baseWidth: imgW,
        baseHeight: imgH
      };
    }
    return {
      ...c,
      baseWidth: imgW,
      baseHeight: imgH,
      pinX: pinX,
      pinY: pinY
    };
  });

  renderEcuHotspots();
}

// Save to Firestore and LocalStorage (Multi-Layer Zero-Fail Sync con Seguro de Trazos)
async function saveEcuHotspotsToStorage() {
  const svg = document.getElementById('consoleEcuSvgOverlay');
  const vb = svg ? svg.viewBox.baseVal : null;
  const baseW = (vb && vb.width > 0) ? vb.width : (document.getElementById('consoleMainDiagramImg')?.naturalWidth || 1000);
  const baseH = (vb && vb.height > 0) ? vb.height : (document.getElementById('consoleMainDiagramImg')?.naturalHeight || 1094);

  // Add permanent lock signature and base calibration coordinates to all saved components
  currentEcuHotspots = currentEcuHotspots.map(c => ({
    ...c,
    baseWidth: c.baseWidth || baseW,
    baseHeight: c.baseHeight || baseH,
    isLocked: true,
    userDefined: true,
    lastSaved: Date.now()
  }));

  localStorage.setItem(currentEcuStorageKey, JSON.stringify(currentEcuHotspots));
  localStorage.setItem('probaktronic_ecu_hotspots_master_' + currentEcuStorageKey, JSON.stringify(currentEcuHotspots));

  const active = window._currentActiveDiagramData || {};
  const archDoc = active._selectedArchDoc || {};

  try {
    if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
      const db = firebase.firestore();

      // Layer A: Write directly into the specific diagram document in Firestore
      if (archDoc.brandDocId && archDoc.modelDocId && archDoc.anioDocId && archDoc.motorDocId && archDoc.archDocId) {
        const cleanBrand = (archDoc.brandDocId || '').toLowerCase().trim();
        const cleanModel = (archDoc.modelDocId || '').toLowerCase().trim();
        await db.collection('diagramas').doc(cleanBrand)
          .collection('modelos').doc(cleanModel)
          .collection('anios').doc(archDoc.anioDocId)
          .collection('motores').doc(archDoc.motorDocId)
          .collection('archivos').doc(archDoc.archDocId)
          .set({
            componentes_ecu: currentEcuHotspots,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).catch(err => console.warn('Diagram doc hotspots save error:', err));
        console.log('Componentes ECU guardados directamente en el documento del diagrama en Firestore.');
      }

      // Layer B: Write to collection 'diagramas' > 'ecu_hotspots' (Protected by diagram rules)
      await db.collection('diagramas').doc('ecu_hotspots').collection('items').doc(currentEcuStorageKey).set({
        componentes: currentEcuHotspots,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => null);

      // Layer C: Write to 'ecu_interactive_hotspots'
      await db.collection('ecu_interactive_hotspots').doc(currentEcuStorageKey).set({
        componentes: currentEcuHotspots,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => null);

      console.log('Componentes ECU sincronizados exitosamente en Firestore.');
      if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast('¡Componentes de la ECU guardados en la nube de Firebase!');
      }
    }
  } catch (err) {
    console.warn('Firestore hotspots save warning:', err);
  }
}

// Dynamic Adaptive Legend for ECU Components (Displays all present categories and custom colors)
window.renderEcuColorLegend = function() {
  const container = document.getElementById('consoleEcuColorLegend');
  if (!container) return;

  let itemsContainer = document.getElementById('consoleEcuColorLegendItems');
  if (!itemsContainer) {
    itemsContainer = document.createElement('div');
    itemsContainer.id = 'consoleEcuColorLegendItems';
    itemsContainer.className = 'd-flex flex-wrap align-items-center gap-2 flex-grow-1';
    container.appendChild(itemsContainer);
  }

  const categoryMap = new Map();
  (currentEcuHotspots || []).forEach(comp => {
    const theme = window.getEcuComponentTheme(comp);
    const cat = window.normalizeEcuCategory(comp.category || comp.tipo || comp.name);
    const friendlyName = ECU_FRIENDLY_TYPES[cat] || comp.category || comp.tipo || comp.name || cat;
    const color = (comp.customColor && comp.customColor !== 'auto') ? comp.customColor : theme.color;
    const fill = theme.fill || (color + '26');
    const glow = theme.glow || color;
    const key = `${cat}_${color}`;

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        categoryKey: cat,
        label: friendlyName,
        color: color,
        fill: fill,
        glow: glow,
        icon: theme.icon || 'bi-square-fill'
      });
    }
  });

  if (categoryMap.size === 0) {
    itemsContainer.innerHTML = '<span class="text-white-50 small fst-italic" style="font-size: 0.75rem;">Sin componentes registrados en esta placa</span>';
    container.classList.remove('d-none');
    container.style.display = 'flex';
    return;
  }

  itemsContainer.innerHTML = Array.from(categoryMap.values()).map(item => {
    return `
      <span class="badge ecu-legend-badge" data-category="${item.categoryKey}" style="background: ${item.fill}; border: 1px solid ${item.color}; color: ${item.glow}; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px;">
        <i class="bi bi-square-fill" style="color: ${item.color}; font-size: 0.7rem;"></i>
        <span>${item.label}</span>
      </span>
    `;
  }).join('');

  container.classList.remove('d-none');
  container.style.display = 'flex';
};

// Render SVG Hotspot Nodes with Color Habit Theme (Strict Multi-Layer Z-Order & High Contrast)
function renderEcuHotspots() {
  const group = document.getElementById('consoleEcuHotspotsGroup');
  if (!group) return;
  group.innerHTML = '';

  const zonesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  zonesLayer.id = 'ecuZonesBaseLayer';
  const chipsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  chipsLayer.id = 'ecuChipsTopLayer';
  const pinsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pinsLayer.id = 'ecuPinsOverlayLayer';

  group.appendChild(zonesLayer);
  group.appendChild(chipsLayer);
  group.appendChild(pinsLayer);

  (currentEcuHotspots || []).forEach(comp => {
    const theme = window.getEcuComponentTheme(comp);
    const isZone = comp.isZone || comp.type === 'polygon' || comp.pathD;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-id', comp.id);
    g.style.cursor = 'pointer';

    if (isZone && comp.pathD) {
      // 1. Freeform Zone / Stage Path (Base Layer)
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', comp.pathD);
      pathEl.setAttribute('class', 'ecu-hotspot-zone');
      pathEl.id = `ecu-box-${comp.id}`;
      pathEl.style.stroke = theme.color;
      pathEl.style.strokeWidth = '2px';
      pathEl.style.fill = theme.color + '22'; // 13% soft translucent fill
      pathEl.style.filter = `drop-shadow(0 0 6px ${theme.color})`;
      g.appendChild(pathEl);
      zonesLayer.appendChild(g);
    } else {
      // 2. Individual IC Chip Box (Top Layer with Solid High Contrast & Vibrant Glow)
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', comp.x);
      rect.setAttribute('y', comp.y);
      rect.setAttribute('width', comp.width);
      rect.setAttribute('height', comp.height);
      rect.setAttribute('rx', '5');
      rect.setAttribute('class', 'ecu-hotspot-box');
      rect.id = `ecu-box-${comp.id}`;
      rect.style.stroke = theme.color;
      rect.style.strokeWidth = '2.5px';
      rect.style.fill = theme.color + '44'; // 27% vivid fill so orange/chips stand out crisp over any background
      rect.style.filter = `drop-shadow(0 0 8px ${theme.color})`;
      g.appendChild(rect);
      chipsLayer.appendChild(g);
    }

    // 3. Pin indicator (Upper Overlay Layer)
    const pinX = (typeof comp.pinX === 'number' && !isNaN(comp.pinX)) ? comp.pinX : Math.round((comp.x || 0) + (comp.width || 100) / 2);
    const pinY = (typeof comp.pinY === 'number' && !isNaN(comp.pinY)) ? comp.pinY : Math.round((comp.y || 0) + (comp.height || 100) / 2);

    const pinG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pinG.setAttribute('class', 'ecu-hotspot-pin');
    pinG.setAttribute('transform', `translate(${pinX}, ${pinY})`);
    pinG.id = `ecu-pin-${comp.id}`;

    const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerRing.setAttribute('class', 'outer-ring');
    outerRing.setAttribute('r', isZone ? '16' : '14');
    outerRing.style.stroke = theme.color;
    outerRing.style.strokeWidth = '2px';

    const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerDot.setAttribute('class', 'inner-dot');
    innerDot.setAttribute('r', isZone ? '6' : '5');
    innerDot.style.fill = theme.color;

    pinG.appendChild(outerRing);
    pinG.appendChild(innerDot);

    // Event listeners
    const triggerSelect = (e) => {
      if (isEcuEditorMode) return;
      e.stopPropagation();
      window.selectEcuComponent(comp);
    };

    g.addEventListener('click', triggerSelect);
    pinG.addEventListener('click', triggerSelect);

    pinsLayer.appendChild(pinG);
  });

  // Dynamically update adaptive legend in single line
  window.renderEcuColorLegend();
}

// Select Component & Show Details + Animated Leader Line (Smart Closest-Side Placement)
window.selectEcuComponent = function(comp) {
  activeEcuComponentId = comp.id;
  const theme = window.getEcuComponentTheme(comp);

  const drawer = document.getElementById('consoleEcuInfoDrawer');
  const drawerTitle = document.getElementById('ecuDrawerTitle');
  const drawerHeaderIcon = document.getElementById('ecuDrawerHeaderIcon');
  const drawerContent = document.getElementById('ecuDrawerContent');

  // Reset active classes and restore baseline color themes on both boxes and zones
  document.querySelectorAll('.ecu-hotspot-box, .ecu-hotspot-zone').forEach(el => {
    el.classList.remove('active');
    const compId = el.id.replace('ecu-box-', '');
    const c = currentEcuHotspots.find(item => item.id === compId);
    const t = window.getEcuComponentTheme(c);
    el.style.stroke = t.color;
    el.style.fill = (c && (c.isZone || c.type === 'polygon' || c.pathD)) ? (t.color + '26') : t.fill;
    el.style.filter = `drop-shadow(0 0 6px ${t.color})`;
    el.style.strokeWidth = '2px';
  });

  document.querySelectorAll('.ecu-hotspot-pin').forEach(el => {
    el.classList.remove('active');
    const compId = el.id.replace('ecu-pin-', '');
    const c = currentEcuHotspots.find(item => item.id === compId);
    const t = window.getEcuComponentTheme(c);
    const r = el.querySelector('.outer-ring');
    const d = el.querySelector('.inner-dot');
    if (r) r.style.stroke = t.color;
    if (d) d.style.fill = t.color;
  });

  const box = document.getElementById(`ecu-box-${comp.id}`);
  const pin = document.getElementById(`ecu-pin-${comp.id}`);
  if (box) {
    box.classList.add('active');
    box.style.stroke = theme.color;
    box.style.fill = theme.color + '4D'; // 30% fill
    box.style.strokeWidth = '3.5px';
    box.style.filter = `drop-shadow(0 0 14px ${theme.glow})`;
  }
  if (pin) {
    pin.classList.add('active');
    const r = pin.querySelector('.outer-ring');
    const d = pin.querySelector('.inner-dot');
    if (r) r.style.stroke = theme.glow;
    if (d) d.style.fill = theme.glow;
  }

  const pinX = (typeof comp.pinX === 'number' && !isNaN(comp.pinX)) ? comp.pinX : Math.round((comp.x || 0) + (comp.width || 100) / 2);
  const pinY = (typeof comp.pinY === 'number' && !isNaN(comp.pinY)) ? comp.pinY : Math.round((comp.y || 0) + (comp.height || 100) / 2);

  // Populate Rich Technical Drawer with Title Subtitle and Conditional Section Rendering
  if (drawer && drawerTitle && drawerContent) {
    const cat = window.normalizeEcuCategory(comp.category || comp.tipo || comp.name);
    const friendlyMap = window.ECU_FRIENDLY_TYPES || ECU_FRIENDLY_TYPES || {};
    const defaultFriendly = friendlyMap[cat] || cat;
    const rawSubLabel = (comp.tipo && comp.tipo.trim() !== '') ? comp.tipo.trim() : defaultFriendly;
    const subLabel = rawSubLabel.toUpperCase();
    drawerTitle.innerHTML = `<span class="text-white font-rajdhani fw-bold me-1">${comp.name || 'COMPONENTE'}</span> <span class="text-white-50 mx-1">&bull;</span> <span class="font-rajdhani fw-bold" style="color: ${theme.glow}; font-size: 0.95rem;">${subLabel}</span>`;
    drawer.style.borderColor = theme.color;
    drawer.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.7), 0 0 25px ${theme.fill}`;

    if (drawerHeaderIcon) {
      drawerHeaderIcon.className = `bi ${theme.icon} fs-5`;
      drawerHeaderIcon.style.color = theme.color;
    }

    const dtcBadges = (comp.dtcs && comp.dtcs.trim() !== '') ? comp.dtcs.split(',').map(d => `<span class="badge bg-danger bg-opacity-25 text-danger border border-danger me-1 font-monospace">${d.trim()}</span>`).join(' ') : '';
    const mfgBadge = (comp.manufacturer && comp.manufacturer.trim() !== '') ? `<span class="badge bg-secondary me-1"><i class="bi bi-building me-1"></i>${comp.manufacturer}</span>` : '';
    const pkgBadge = (comp.package && comp.package.trim() !== '') ? `<span class="badge bg-dark border border-secondary text-info me-1 font-monospace">${comp.package}</span>` : '';
    const codeLine = (comp.code && comp.code.trim() !== '' && comp.code !== 'N/A') ? `<div class="font-monospace small mb-2 fw-bold fs-6" style="color: ${theme.glow};">${comp.code}</div>` : '';

    // SECCIÓN 2: Función (Condicional)
    const hasControla = comp.show_controla !== false && comp.controla && comp.controla.trim() !== '';
    const controlaHtml = hasControla ? `
      <div class="tech-box" style="border-left: 3px solid ${theme.color};">
        <div class="spec-label mb-1 fw-bold" style="color: ${theme.glow};"><i class="bi bi-gear-wide-connected me-1"></i>¿Qué Controla en el Motor?</div>
        <div class="text-light small" style="line-height: 1.45;">${comp.controla}</div>
      </div>
    ` : '';

    // SECCIÓN 3: Parámetros Eléctricos / Voltajes / Pines (Condicional)
    const hasVoltajes = comp.show_voltajes !== false && ((comp.voltajes && comp.voltajes.trim() !== '') || (comp.pines_clave && comp.pines_clave.trim() !== ''));
    let voltajesHtml = '';
    if (hasVoltajes) {
      let rows = '';
      if (comp.voltajes && comp.voltajes.trim() !== '') {
        rows += `
          <div class="d-flex justify-content-between mb-1 pb-1 ${comp.pines_clave && comp.pines_clave.trim() !== '' ? 'border-bottom border-secondary border-opacity-25' : ''}">
            <span class="spec-label">Voltaje Operación:</span>
            <span class="spec-val" style="color: ${theme.glow};">${comp.voltajes}</span>
          </div>
        `;
      }
      if (comp.pines_clave && comp.pines_clave.trim() !== '') {
        rows += `
          <div class="mt-1">
            <span class="spec-label d-block mb-1">Pines Críticos (Medición):</span>
            <span class="spec-val text-warning small font-monospace d-block">${comp.pines_clave}</span>
          </div>
        `;
      }
      voltajesHtml = `<div class="tech-box">${rows}</div>`;
    }

    // SECCIÓN 4: Síntomas de Falla y DTCs (Condicional)
    const hasFallas = comp.show_fallas !== false && ((comp.fallas_comunes && comp.fallas_comunes.trim() !== '') || (comp.dtcs && comp.dtcs.trim() !== ''));
    let fallasHtml = '';
    if (hasFallas) {
      fallasHtml = `
        <div class="alert alert-danger bg-opacity-10 border-danger text-white small p-2 mb-2">
          <div class="fw-bold mb-1 text-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> Síntomas de Falla:</div>
          ${comp.fallas_comunes && comp.fallas_comunes.trim() !== '' ? `<div class="text-light" style="font-size: 0.82rem;">${comp.fallas_comunes}</div>` : ''}
          ${dtcBadges ? `<div class="mt-2 pt-1 border-top border-danger border-opacity-25"><strong class="small text-danger me-1">DTCs:</strong> ${dtcBadges}</div>` : ''}
        </div>
      `;
    }

    drawerContent.innerHTML = `
      <div class="d-flex flex-wrap align-items-center gap-1 mb-2">
        <span class="badge" style="background: ${theme.fill}; color: ${theme.glow}; border: 1px solid ${theme.color}; font-size: 0.78rem; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 0.5px;">
          <i class="bi ${theme.icon} me-1"></i> ${defaultFriendly}
        </span>
        ${mfgBadge}
        ${pkgBadge}
      </div>

      ${codeLine}
      ${controlaHtml}
      ${voltajesHtml}
      ${fallasHtml}
    `;

    drawer.classList.remove('d-none');
    drawer.style.display = 'flex';
  }

  // Dynamically position drawer and connect leader line directly to drawer header
  window.positionActiveEcuDrawerAndLine(comp, theme);

  window.updateEcuAdminUI();
};

// Dynamically align drawer vertically with chip pin and connect leader line seamlessly
window.positionActiveEcuDrawerAndLine = function(comp, theme) {
  if (!comp) return;
  const line = document.getElementById('consoleEcuActiveLeaderLine');
  const drawer = document.getElementById('consoleEcuInfoDrawer');
  const svg = document.getElementById('consoleEcuSvgOverlay');
  const wrap = document.getElementById('consoleImgViewerWrap');
  if (!drawer || !svg) return;

  const vb = svg.viewBox.baseVal || { width: 1000, height: 1094 };
  const vbWidth = (vb && vb.width > 0) ? vb.width : 1000;
  const vbHeight = (vb && vb.height > 0) ? vb.height : 1094;

  const pinX = (typeof comp.pinX === 'number' && !isNaN(comp.pinX)) ? comp.pinX : Math.round((comp.x || 0) + (comp.width || 100) / 2);
  const pinY = (typeof comp.pinY === 'number' && !isNaN(comp.pinY)) ? comp.pinY : Math.round((comp.y || 0) + (comp.height || 100) / 2);

  const wrapRect = wrap ? wrap.getBoundingClientRect() : { top: 0, left: 0, width: 1000, height: 600 };
  const matrix = svg.getScreenCTM();

  let pinScreenX = pinX;
  let pinScreenY = pinY;
  if (matrix) {
    const pt = svg.createSVGPoint();
    pt.x = pinX;
    pt.y = pinY;
    const transformed = pt.matrixTransform(matrix);
    pinScreenX = transformed.x - wrapRect.left;
    pinScreenY = transformed.y - wrapRect.top;
  }

  const isLeftSide = pinScreenX < (wrapRect.width / 2);

  drawer.classList.remove('d-none');
  drawer.style.display = 'flex';

  if (window.innerWidth > 768) {
    const drawerHeight = drawer.offsetHeight || 260;
    // Align top of drawer with pin level
    let targetTop = Math.round(pinScreenY - 26);
    const maxTop = Math.max(10, wrapRect.height - drawerHeight - 15);
    targetTop = Math.max(10, Math.min(targetTop, maxTop));

    drawer.style.top = `${targetTop}px`;
    drawer.style.bottom = 'auto';
    if (isLeftSide) {
      drawer.style.left = '12px';
      drawer.style.right = 'auto';
    } else {
      drawer.style.right = '12px';
      drawer.style.left = 'auto';
    }
  }

  // Draw Leader Line directly to the drawer's header anchor
  if (line) {
    const startX = pinX;
    const startY = pinY;
    let targetX = isLeftSide ? 0 : vbWidth;
    let targetY = pinY;

    if (matrix && window.innerWidth > 768) {
      const drawerRect = drawer.getBoundingClientRect();
      const anchorScreenPt = svg.createSVGPoint();
      anchorScreenPt.x = isLeftSide ? drawerRect.right : drawerRect.left;
      anchorScreenPt.y = drawerRect.top + 24; // Align with header
      const anchorSvgPt = anchorScreenPt.matrixTransform(matrix.inverse());

      targetX = isLeftSide ? Math.max(0, Math.min(vbWidth * 0.05, anchorSvgPt.x)) : Math.min(vbWidth, Math.max(vbWidth * 0.95, anchorSvgPt.x));
      targetY = Math.max(10, Math.min(vbHeight - 10, Math.round(anchorSvgPt.y)));
    }

    const midX = Math.round(startX + (targetX - startX) * 0.45);
    line.setAttribute('d', `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${targetY} L ${targetX} ${targetY}`);
    line.style.stroke = theme.color;
    line.style.filter = `drop-shadow(0 0 8px ${theme.glow})`;
    line.style.display = 'block';
  }
};

window.closeEcuInfoDrawer = function() {
  const drawer = document.getElementById('consoleEcuInfoDrawer');
  const line = document.getElementById('consoleEcuActiveLeaderLine');
  if (drawer) {
    drawer.classList.add('d-none');
    drawer.style.display = 'none';
  }
  if (line) line.style.display = 'none';

  // Reset active classes and restore baseline color themes on both boxes and zones
  document.querySelectorAll('.ecu-hotspot-box, .ecu-hotspot-zone').forEach(el => {
    el.classList.remove('active');
    const compId = el.id.replace('ecu-box-', '');
    const c = currentEcuHotspots.find(item => item.id === compId);
    if (c) {
      const t = window.getEcuComponentTheme(c);
      el.style.stroke = t.color;
      el.style.fill = (c.isZone || c.type === 'polygon' || c.pathD) ? (t.color + '26') : t.fill;
      el.style.filter = `drop-shadow(0 0 6px ${t.color})`;
      el.style.strokeWidth = (c.isZone || c.type === 'polygon' || c.pathD) ? '2px' : '2.5px';
    }
  });

  document.querySelectorAll('.ecu-hotspot-pin').forEach(el => {
    el.classList.remove('active');
    const compId = el.id.replace('ecu-pin-', '');
    const c = currentEcuHotspots.find(item => item.id === compId);
    if (c) {
      const t = window.getEcuComponentTheme(c);
      const r = el.querySelector('.outer-ring');
      const d = el.querySelector('.inner-dot');
      if (r) r.style.stroke = t.color;
      if (d) d.style.fill = t.color;
    }
  });

  activeEcuComponentId = null;
  window.updateEcuAdminUI();
};

// Auto-hide ECU Component Info Drawer when clicking anywhere outside
document.addEventListener('click', (e) => {
  const drawer = document.getElementById('consoleEcuInfoDrawer');
  if (!drawer || drawer.classList.contains('d-none') || drawer.style.display === 'none') {
    return;
  }
  // Don't close if drawing/editing mode is active
  if (typeof isEcuEditorMode !== 'undefined' && isEcuEditorMode) {
    return;
  }
  // Ignore if user was dragging/panning the viewer
  if (typeof lastViewerPanTime !== 'undefined' && (Date.now() - lastViewerPanTime < 180)) {
    return;
  }
  // Ignore clicks inside the drawer
  if (e.target.closest('#consoleEcuInfoDrawer')) {
    return;
  }
  // Ignore clicks on hotspots/pins/zones as they select components
  if (e.target.closest('.ecu-hotspot-box') || e.target.closest('.ecu-hotspot-zone') || e.target.closest('.ecu-hotspot-pin') || e.target.closest('#consoleEcuHotspotsGroup')) {
    return;
  }
  // Ignore clicks inside modals, dropdowns, or toasts
  if (e.target.closest('.modal') || e.target.closest('.modal-backdrop') || e.target.closest('.toast') || e.target.closest('.dropdown-menu')) {
    return;
  }

  // Close info drawer
  window.closeEcuInfoDrawer();
});

// Edit Active Component (Modificar datos de un componente existente)
window.editActiveEcuComponent = function() {
  if (!activeEcuComponentId) return;
  const comp = currentEcuHotspots.find(c => c.id === activeEcuComponentId);
  if (!comp) return;

  editingEcuHotspotId = comp.id;
  tempEcuBoxData = {
    ...comp,
    x: comp.x,
    y: comp.y,
    width: comp.width,
    height: comp.height,
    pinX: comp.pinX || Math.round(comp.x + comp.width / 2),
    pinY: comp.pinY || Math.round(comp.y + comp.height / 2),
    isZone: !!(comp.isZone || comp.type === 'polygon' || comp.pathD),
    type: comp.type || (comp.isZone ? 'polygon' : 'rect'),
    pathD: comp.pathD || null,
    points: comp.points || null
  };

  drawChipPreviewSnapshot(comp.x, comp.y, comp.width, comp.height);

  const nameEl = document.getElementById('adminEcuCompName');
  const tipoEl = document.getElementById('adminEcuCompTipo');
  const codeEl = document.getElementById('adminEcuCompCode');
  const catEl = document.getElementById('adminEcuCompCategory');
  const mfgEl = document.getElementById('adminEcuCompManufacturer');
  const pkgEl = document.getElementById('adminEcuCompPackage');
  const checkCtrl = document.getElementById('adminEcuCheckControla');
  const funEl = document.getElementById('adminEcuCompControla');
  const checkVolt = document.getElementById('adminEcuCheckVoltajes');
  const voltEl = document.getElementById('adminEcuCompVoltajes');
  const pinEl = document.getElementById('adminEcuCompPines');
  const checkFail = document.getElementById('adminEcuCheckFallas');
  const dtcEl = document.getElementById('adminEcuCompDtcs');
  const failEl = document.getElementById('adminEcuCompFallas');
  const colorEl = document.getElementById('adminEcuCompCustomColor');

  let cat = comp.category || 'EEPROM / Memoria';
  if (CATEGORY_ALIASES[cat]) cat = CATEGORY_ALIASES[cat];
  const defaultFriendly = window.ECU_FRIENDLY_TYPES[cat] || '';

  if (nameEl) nameEl.value = comp.name || '';
  if (tipoEl) tipoEl.value = comp.tipo || defaultFriendly;
  if (codeEl) codeEl.value = (comp.code === 'N/A' ? '' : comp.code) || '';
  if (catEl) catEl.value = cat;
  if (mfgEl) mfgEl.value = comp.manufacturer || '';
  if (pkgEl) pkgEl.value = comp.package || '';
  if (checkCtrl) checkCtrl.checked = (comp.show_controla !== false);
  if (funEl) funEl.value = comp.controla || '';
  if (checkVolt) checkVolt.checked = (comp.show_voltajes !== false);
  if (voltEl) voltEl.value = comp.voltajes || '';
  if (pinEl) pinEl.value = comp.pines_clave || '';
  if (checkFail) checkFail.checked = (comp.show_fallas !== false);
  if (dtcEl) dtcEl.value = comp.dtcs || '';
  if (failEl) failEl.value = comp.fallas_comunes || '';
  if (colorEl) colorEl.value = comp.customColor || window.getEcuComponentTheme(comp).color;

  const coordX = document.getElementById('adminEcuCoordX');
  const coordY = document.getElementById('adminEcuCoordY');
  const coordW = document.getElementById('adminEcuCoordW');
  const coordH = document.getElementById('adminEcuCoordH');
  const coordPinX = document.getElementById('adminEcuCoordPinX');
  const coordPinY = document.getElementById('adminEcuCoordPinY');
  if (coordX) coordX.value = comp.x;
  if (coordY) coordY.value = comp.y;
  if (coordW) coordW.value = comp.width;
  if (coordH) coordH.value = comp.height;
  if (coordPinX) coordPinX.value = (comp.pinX !== undefined) ? comp.pinX : Math.round(comp.x + comp.width / 2);
  if (coordPinY) coordPinY.value = (comp.pinY !== undefined) ? comp.pinY : Math.round(comp.y + comp.height / 2);

  window.updateEcuColorPickerPreview();

  const modalTitle = document.querySelector('#modalAdminAddEcuComponent .modal-title');
  const submitBtn = document.querySelector('#formAdminAddEcuComponent button[type="submit"]');
  if (modalTitle) modalTitle.textContent = `EDITAR FICHA TÉCNICA: ${comp.name}`;
  if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> ACTUALIZAR Y GUARDAR CAMBIOS';

  const modalEl = document.getElementById('modalAdminAddEcuComponent');
  if (modalEl) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

// Quick Template Preset Loader for Fast & Detailed Mapping (12 Plantillas Específicas)
window.applyEcuTemplate = function(type) {
  const nameEl = document.getElementById('adminEcuCompName');
  const tipoEl = document.getElementById('adminEcuCompTipo');
  const codeEl = document.getElementById('adminEcuCompCode');
  const catEl = document.getElementById('adminEcuCompCategory');
  const mfgEl = document.getElementById('adminEcuCompManufacturer');
  const pkgEl = document.getElementById('adminEcuCompPackage');
  const checkCtrl = document.getElementById('adminEcuCheckControla');
  const funEl = document.getElementById('adminEcuCompControla');
  const checkVolt = document.getElementById('adminEcuCheckVoltajes');
  const voltEl = document.getElementById('adminEcuCompVoltajes');
  const pinEl = document.getElementById('adminEcuCompPines');
  const checkFail = document.getElementById('adminEcuCheckFallas');
  const dtcEl = document.getElementById('adminEcuCompDtcs');
  const failEl = document.getElementById('adminEcuCompFallas');

  const templates = {
    eeprom: {
      name: 'Memoria EEPROM / Inmovilizador',
      tipo: 'MEMORIA EEPROM / FLASH',
      code: '93C86 / 25Cxxx SPI',
      cat: 'EEPROM / Memoria',
      mfg: 'ST / Microchip',
      pkg: 'SOIC-8',
      fun: 'Almacena codificación de llaves transponder (Inmovilizador), VIN del vehículo y tablas de calibración.',
      volt: 'VCC: +5.0V en Pin 8',
      pin: 'Pin 1: CS &bull; Pin 4: GND &bull; Pin 8: VCC 5V',
      dtcs: 'B2799, P1600, B2796',
      fail: 'Bloqueo de arranque del motor, testigo de seguridad parpadea, pérdida de sincronización de llaves.'
    },
    microprocesador: {
      name: 'Microprocesador Principal (MCU)',
      tipo: 'MICROPROCESADOR (MCU)',
      code: 'DENSO 32-Bit / Renesas SH7058',
      cat: 'Microprocesador',
      mfg: 'Renesas / Toshiba',
      pkg: 'QFP-144 / QFP-176',
      fun: 'Unidad central de cálculo de la computadora. Procesa señales de sensores en tiempo real y ejecuta mapas de inyección y avance.',
      volt: 'VCC: 5.00V ±0.05V / Núcleo: 3.3V',
      pin: 'Pines VCC (+5V) &bull; Cristal: 20MHz',
      dtcs: 'P0606, P0607, P1600',
      fail: 'Vehículo no arranca, no enciende Check Engine, sin comunicación con escáner OBD2.'
    },
    inyectores: {
      name: 'Driver de Inyectores Common Rail',
      tipo: 'DRIVER DE INYECTORES',
      code: 'SE555 / MOSFET Array',
      cat: 'Inyectores',
      mfg: 'Denso / Bosch',
      pkg: 'Power SOIC / QFP',
      fun: 'Comanda los pulsos de apertura y cierre de los inyectores electrohidráulicos mediante descarga de alta tensión (80V) y mantenimiento de corriente PWM.',
      volt: 'Disparo: 80V DC &bull; Retorno PWM: 12V',
      pin: 'Gate: 5V Lógica &bull; Drain: Señal a Inyector',
      dtcs: 'P0201, P0202, P0203, P0204',
      fail: 'Fallo de cilindro (Misfire), motor sin fuerza, humo negro denso, inyector bloqueado.'
    },
    bobinas: {
      name: 'Driver de Bobinas de Encendido',
      tipo: 'DRIVER DE BOBINAS / IGNICIÓN',
      code: 'IGBT Array / Power Driver',
      cat: 'Bobinas',
      mfg: 'ST / Infineon',
      pkg: 'D2PAK / TO-252',
      fun: 'Comanda el disparo de chispa de alta tensión hacia las bobinas de ignición.',
      volt: 'Disparo: 5V Lógica &bull; Alimentación: 12V',
      pin: 'Gate: Disparo 5V &bull; Colector: Salida Bobina',
      dtcs: 'P0351, P0352, P0353, P0354',
      fail: 'Sin chispa en cilindro, motor tiembla intensamente, explosiones en admisión.'
    },
    voltaje: {
      name: 'Regulador Multi-Voltaje & Power IC',
      tipo: 'REGULADOR DE VOLTAJE',
      code: 'SE587 / System Power Management',
      cat: 'Voltaje',
      mfg: 'Denso / Infineon',
      pkg: 'Power QFP-44',
      fun: 'Convierte +12V de batería en fuentes reguladas de +5.0V para sensores de motor y +3.3V para procesador.',
      volt: 'Entrada: +12V BATT &bull; Salida VREF: +5.00V ±0.02V',
      pin: 'V_IN: 12V Ignición &bull; VREF: 5.0V Sensores',
      dtcs: 'P0641, P0651, P0685',
      fail: 'Sensores de motor marcan 0V o 5V fijo, códigos de sobretensión, cortes intermitentes.'
    },
    diodos: {
      name: 'Diodo de Protección / Transceiver CAN',
      tipo: 'DIODOS / PROTECCIÓN',
      code: 'TVS Diode Array / TJA1050',
      cat: 'Diodos',
      mfg: 'Vishay / NXP',
      pkg: 'SMB / SOT-23',
      fun: 'Protección contra picos de voltaje transitorios y supresión de sobretensiones en líneas de datos OBD2.',
      volt: 'Tensión de ruptura: 18V - 24V',
      pin: 'Ánodo: GND &bull; Cátodo: Línea 12V / CAN',
      dtcs: 'U0100, P0685',
      fail: 'Cortocircuito a masa, fusible principal quemado, error de enlace OBD2.'
    },
    efi: {
      name: 'Circuito de Alimentación Principal EFI',
      tipo: 'ALIMENTACIÓN PRINCIPAL EFI',
      code: 'EFI Main Relay Driver',
      cat: 'EFI',
      mfg: 'Denso / Toyota',
      pkg: 'TO-263 / Power IC',
      fun: 'Controla la activación del relé principal EFI y la alimentación general de la ECU tras el contacto de llave.',
      volt: 'Entrada BATT: 12.6V &bull; Control: GND activo',
      pin: 'M-REL: 12V &bull; IGSW: 12V',
      dtcs: 'P0685, P0686',
      fail: 'No activa relé principal, ECU completamente apagada sin respuesta.'
    },
    driver_sensor: {
      name: 'Driver de Sensores CKP / CMP',
      tipo: 'DRIVER DE SENSORES',
      code: 'Sensor Interface IC',
      cat: 'Driver Sensor',
      mfg: 'Denso / ST',
      pkg: 'SOIC-16',
      fun: 'Acondiciona y digitaliza señales inductivas o Hall de cigüeñal y árbol de levas para el MCU.',
      volt: 'VCC: 5.0V &bull; Señal: 0V - 5V Digital',
      pin: 'NE+: Entrada CKP &bull; G+: Entrada CMP',
      dtcs: 'P0335, P0340',
      fail: 'Motor gira pero no arranca, sin pulso de inyección, tacómetro no marca RPM.'
    },
    transistor: {
      name: 'Transistor MOSFET de Potencia SMD',
      tipo: 'TRANSISTOR / MOSFET SMD',
      code: 'N-Channel Power MOSFET',
      cat: 'Transistor',
      mfg: 'Toshiba / Vishay',
      pkg: 'SOT-223 / DPAK',
      fun: 'Conmutación de potencia para actuadores auxiliares (SCV, EGR, mariposa motorizada).',
      volt: '12V / PWM',
      pin: 'Gate: 5V &bull; Drain: Salida &bull; Source: Masa',
      dtcs: 'P0087, P0403',
      fail: 'Actuador no conmuta o queda permanentemente energizado.'
    },
    resistencia: {
      name: 'Resistencia Shunt / Divisor de Tensión',
      tipo: 'RESISTENCIA SMD',
      code: 'Shunt Resistor 0.05Ω / SMD 2512',
      cat: 'Resistencia',
      mfg: 'Vishay / Panasonic',
      pkg: 'SMD 2512 / 1206',
      fun: 'Medición de corriente por caída de tensión en etapas de inyección y sensores analógicos.',
      volt: 'Caída de mV según amperaje',
      pin: 'Terminal A / Terminal B',
      dtcs: 'P0200, P0606',
      fail: 'Resistencia abierta, falso contacto, ECU detecta sobrecorriente errónea.'
    },
    cristal: {
      name: 'Cristal Oscilador de Cuarzo',
      tipo: 'CRISTAL OSCILADOR',
      code: 'Crystal Resonator 20.000 MHz',
      cat: 'Cristal',
      mfg: 'Murata / NDK',
      pkg: 'SMD Ceramic / HC-49',
      fun: 'Genera la frecuencia de reloj maestro de sincronización para el microprocesador.',
      volt: 'Señal Senoidal 2.5Vpp / 20.0 MHz',
      pin: 'XTAL IN &bull; XTAL OUT &bull; GND',
      dtcs: 'P0606, Sin Comunicación',
      fail: 'Microprocesador no arranca (bloqueado), sin reloj del sistema.'
    },
    condensador: {
      name: 'Condensador de Filtrado SMD / Tantalio',
      tipo: 'CONDENSADOR SMD',
      code: 'Capacitor 100uF 35V / 10uF Tantalum',
      cat: 'Condensador',
      mfg: 'Kemet / AVX',
      pkg: 'SMD Case D / 1210',
      fun: 'Filtrado de rizado de alta frecuencia y estabilización de voltaje en fuentes de alimentación.',
      volt: 'Operación hasta 35V DC',
      pin: 'Polo Positivo (+) &bull; Polo Negativo (-)',
      dtcs: 'P0685, Reinicios intermitentes',
      fail: 'Condensador en corto a masa, caídas de tensión bruscas.'
    }
  };

  const t = templates[type];
  if (!t) return;

  if (nameEl) nameEl.value = t.name;
  if (tipoEl) tipoEl.value = t.tipo;
  if (codeEl) codeEl.value = t.code;
  if (catEl) catEl.value = t.cat;
  if (mfgEl) mfgEl.value = t.mfg;
  if (pkgEl) pkgEl.value = t.pkg;
  if (checkCtrl) checkCtrl.checked = true;
  if (funEl) funEl.value = t.fun;
  if (checkVolt) checkVolt.checked = true;
  if (voltEl) voltEl.value = t.volt;
  if (pinEl) pinEl.value = t.pin;
  if (checkFail) checkFail.checked = true;
  if (dtcEl) dtcEl.value = t.dtcs;
  if (failEl) failEl.value = t.fail;

  window.updateEcuColorPickerPreview();
};

// Admin Editor Controls
window.toggleAdminEcuEditorMode = function() {
  isEcuEditorMode = !isEcuEditorMode;
  const toggleBtn = document.getElementById('btnAdminToggleEcuEditor');
  const btnText = document.getElementById('adminEcuEditorBtnText');
  const banner = document.getElementById('consoleEcuEditorBanner');
  const wrap = document.getElementById('consoleImgViewerWrap');
  const svg = document.getElementById('consoleEcuSvgOverlay');

  if (isEcuEditorMode) {
    window.closeEcuInfoDrawer();
    if (toggleBtn) {
      toggleBtn.classList.remove('btn-outline-warning');
      toggleBtn.classList.add('btn-warning', 'text-dark');
    }
    if (btnText) btnText.textContent = 'FINALIZAR DIBUJO';
    if (banner) banner.classList.remove('d-none');
    if (wrap) wrap.style.cursor = 'crosshair';
    if (svg) svg.classList.add('drawing-mode');
  } else {
    window.closeEcuInfoDrawer();
    if (toggleBtn) {
      toggleBtn.classList.add('btn-outline-warning');
      toggleBtn.classList.remove('btn-warning', 'text-dark');
    }
    if (btnText) btnText.textContent = 'DIBUJAR ESPACIOS';
    if (banner) banner.classList.add('d-none');
    if (wrap) wrap.style.cursor = 'grab';
    if (svg) svg.classList.remove('drawing-mode');
  }

  window.updateEcuAdminUI();
};

window.cancelAdminEcuDrawing = function() {
  isEcuDrawing = false;
  ecuLassoPoints = [];
  editingEcuHotspotId = null;
  const box = document.getElementById('consoleEcuDrawingBox');
  if (box) box.style.display = 'none';
  const lassoPreview = document.getElementById('consoleEcuLassoPreview');
  if (lassoPreview) lassoPreview.style.display = 'none';
  tempEcuBoxData = null;

  const modalTitle = document.querySelector('#modalAdminAddEcuComponent .modal-title');
  const submitBtn = document.querySelector('#formAdminAddEcuComponent button[type="submit"]');
  if (modalTitle) modalTitle.textContent = 'DESIGNAR FICHA TÉCNICA DEL COMPONENTE';
  if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> GUARDAR COMPONENTE EN FIREBASE';
};

window.undoLastAdminEcuHotspot = async function() {
  if (currentEcuHotspots.length === 0) {
    alert('No hay componentes registrados para deshacer.');
    return;
  }
  const last = currentEcuHotspots.pop();
  await saveEcuHotspotsToStorage();
  window.closeEcuInfoDrawer();
  renderEcuHotspots();
};

window.deleteActiveEcuComponent = async function() {
  if (!activeEcuComponentId) return;
  if (confirm('¿Deseas eliminar este componente de la ECU permanentemente?')) {
    currentEcuHotspots = currentEcuHotspots.filter(c => c.id !== activeEcuComponentId);
    await saveEcuHotspotsToStorage();
    window.closeEcuInfoDrawer();
    renderEcuHotspots();
  }
};

window.updateModalCoordsPreview = function() {
  const inputX = parseInt(document.getElementById('adminEcuCoordX')?.value);
  const inputY = parseInt(document.getElementById('adminEcuCoordY')?.value);
  const inputW = parseInt(document.getElementById('adminEcuCoordW')?.value);
  const inputH = parseInt(document.getElementById('adminEcuCoordH')?.value);
  if (!isNaN(inputX) && !isNaN(inputY) && !isNaN(inputW) && !isNaN(inputH) && inputW > 0 && inputH > 0) {
    drawChipPreviewSnapshot(inputX, inputY, inputW, inputH);
  }
};

window.handleAdminSubmitEcuComponent = async function(e) {
  e.preventDefault();

  const inputX = parseInt(document.getElementById('adminEcuCoordX')?.value);
  const inputY = parseInt(document.getElementById('adminEcuCoordY')?.value);
  const inputW = parseInt(document.getElementById('adminEcuCoordW')?.value);
  const inputH = parseInt(document.getElementById('adminEcuCoordH')?.value);
  const inputPinX = parseInt(document.getElementById('adminEcuCoordPinX')?.value);
  const inputPinY = parseInt(document.getElementById('adminEcuCoordPinY')?.value);

  const finalX = !isNaN(inputX) ? inputX : (tempEcuBoxData ? tempEcuBoxData.x : 0);
  const finalY = !isNaN(inputY) ? inputY : (tempEcuBoxData ? tempEcuBoxData.y : 0);
  const finalW = !isNaN(inputW) ? Math.max(8, inputW) : (tempEcuBoxData ? tempEcuBoxData.width : 50);
  const finalH = !isNaN(inputH) ? Math.max(8, inputH) : (tempEcuBoxData ? tempEcuBoxData.height : 50);
  const finalPinX = !isNaN(inputPinX) ? inputPinX : (tempEcuBoxData && !isNaN(tempEcuBoxData.pinX) ? tempEcuBoxData.pinX : Math.round(finalX + finalW / 2));
  const finalPinY = !isNaN(inputPinY) ? inputPinY : (tempEcuBoxData && !isNaN(tempEcuBoxData.pinY) ? tempEcuBoxData.pinY : Math.round(finalY + finalH / 2));

  tempEcuBoxData = {
    ...(tempEcuBoxData || {}),
    x: finalX,
    y: finalY,
    width: finalW,
    height: finalH,
    pinX: finalPinX,
    pinY: finalPinY
  };

  const customColorVal = document.getElementById('adminEcuCompCustomColor') ? document.getElementById('adminEcuCompCustomColor').value : null;
  const catVal = document.getElementById('adminEcuCompCategory').value;
  const defaultFriendly = window.ECU_FRIENDLY_TYPES[catVal] || '';
  const tipoVal = (document.getElementById('adminEcuCompTipo') && document.getElementById('adminEcuCompTipo').value.trim() !== '') ? document.getElementById('adminEcuCompTipo').value.trim() : defaultFriendly;
  const codeVal = document.getElementById('adminEcuCompCode') ? document.getElementById('adminEcuCompCode').value.trim() : '';
  const checkCtrl = document.getElementById('adminEcuCheckControla') ? document.getElementById('adminEcuCheckControla').checked : true;
  const checkVolt = document.getElementById('adminEcuCheckVoltajes') ? document.getElementById('adminEcuCheckVoltajes').checked : true;
  const checkFail = document.getElementById('adminEcuCheckFallas') ? document.getElementById('adminEcuCheckFallas').checked : true;

  const compData = {
    name: document.getElementById('adminEcuCompName').value.trim(),
    tipo: tipoVal,
    code: codeVal,
    category: catVal,
    customColor: customColorVal,
    manufacturer: document.getElementById('adminEcuCompManufacturer') ? document.getElementById('adminEcuCompManufacturer').value.trim() : '',
    package: document.getElementById('adminEcuCompPackage') ? document.getElementById('adminEcuCompPackage').value.trim() : '',
    show_controla: checkCtrl,
    controla: document.getElementById('adminEcuCompControla') ? document.getElementById('adminEcuCompControla').value.trim() : '',
    show_voltajes: checkVolt,
    voltajes: document.getElementById('adminEcuCompVoltajes') ? document.getElementById('adminEcuCompVoltajes').value.trim() : '',
    pines_clave: document.getElementById('adminEcuCompPines') ? document.getElementById('adminEcuCompPines').value.trim() : '',
    show_fallas: checkFail,
    dtcs: document.getElementById('adminEcuCompDtcs') ? document.getElementById('adminEcuCompDtcs').value.trim() : '',
    fallas_comunes: document.getElementById('adminEcuCompFallas') ? document.getElementById('adminEcuCompFallas').value.trim() : '',
    isLocked: true,
    userDefined: true,
    ...tempEcuBoxData
  };

  let targetComp = null;

  if (editingEcuHotspotId) {
    // Update existing component with any modified coordinates
    const idx = currentEcuHotspots.findIndex(c => c.id === editingEcuHotspotId);
    if (idx !== -1) {
      currentEcuHotspots[idx] = {
        ...currentEcuHotspots[idx],
        ...compData,
        id: editingEcuHotspotId
      };
      targetComp = currentEcuHotspots[idx];
    }
    editingEcuHotspotId = null;
  } else {
    // Add new component
    const newComp = {
      id: 'ecu_comp_' + Date.now(),
      ...compData
    };
    currentEcuHotspots.push(newComp);
    targetComp = newComp;
  }

  await saveEcuHotspotsToStorage();

  const modalEl = document.getElementById('modalAdminAddEcuComponent');
  const bsModal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
  if (bsModal) bsModal.hide();

  // Reset modal state
  window.cancelAdminEcuDrawing();

  renderEcuHotspots();
  if (targetComp) {
    window.selectEcuComponent(targetComp);
  }
};

// SVG Mouse / Touch Coordinate Helper via Standard Inverse Matrix
function getEcuSvgCoordinates(svg, e) {
  const pt = svg.createSVGPoint();
  if (e.touches && e.touches.length > 0) {
    pt.x = e.touches[0].clientX;
    pt.y = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    pt.x = e.changedTouches[0].clientX;
    pt.y = e.changedTouches[0].clientY;
  } else {
    pt.x = e.clientX;
    pt.y = e.clientY;
  }

  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const transformed = pt.matrixTransform(matrix.inverse());
  const vb = svg.viewBox.baseVal;
  return {
    x: Math.max(0, Math.min(vb.width, Math.round(transformed.x))),
    y: Math.max(0, Math.min(vb.height, Math.round(transformed.y)))
  };
}

// Generate Chip Crop Snapshot on Canvas
function drawChipPreviewSnapshot(boxX, boxY, boxW, boxH) {
  const img = document.getElementById('consoleMainDiagramImg');
  const canvas = document.getElementById('adminEcuCropCanvas');
  const coordsEl = document.getElementById('adminEcuCoordsDisplay');
  if (!img || !canvas) return;

  if (coordsEl) {
    coordsEl.textContent = `X: ${boxX}, Y: ${boxY} [${boxW}x${boxH}px]`;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  try {
    // Map SVG coordinates to image source pixels
    const svg = document.getElementById('consoleEcuSvgOverlay');
    const vb = svg ? svg.viewBox.baseVal : { width: img.naturalWidth || 1000, height: img.naturalHeight || 1094 };

    const scaleX = (img.naturalWidth || img.width) / vb.width;
    const scaleY = (img.naturalHeight || img.height) / vb.height;

    const srcX = Math.max(0, boxX * scaleX);
    const srcY = Math.max(0, boxY * scaleY);
    const srcW = Math.max(1, boxW * scaleX);
    const srcH = Math.max(1, boxH * scaleY);

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.warn('Canvas crop snapshot warning:', err);
  }
}

function setupEcuSvgEventListeners(svg) {
  if (svg.dataset.ecuEventsAttached === 'true') return;
  svg.dataset.ecuEventsAttached = 'true';

  const box = document.getElementById('consoleEcuDrawingBox');
  const lassoPreview = document.getElementById('consoleEcuLassoPreview');

  function handleStart(e) {
    if (!isEcuEditorMode || isSpacePanning) return;
    if (e.button === 1 || e.button === 2) return; // Middle click and right click do not draw
    if (e.type === 'touchstart') {
      if (e.touches && e.touches.length > 1) return; // Multi-touch does not draw
      e.preventDefault();
    }
    e.stopPropagation();

    const p = getEcuSvgCoordinates(svg, e);
    isEcuDrawing = true;
    ecuDrawStartX = p.x;
    ecuDrawStartY = p.y;

    if (currentEcuDrawShape === 'lasso') {
      ecuLassoPoints = [{ x: p.x, y: p.y }];
      if (lassoPreview) {
        lassoPreview.setAttribute('d', `M ${p.x} ${p.y}`);
        lassoPreview.style.display = 'block';
      }
      if (box) box.style.display = 'none';
    } else {
      if (box) {
        box.setAttribute('x', ecuDrawStartX);
        box.setAttribute('y', ecuDrawStartY);
        box.setAttribute('width', 0);
        box.setAttribute('height', 0);
        box.style.display = 'block';
      }
      if (lassoPreview) lassoPreview.style.display = 'none';
    }
  }

  function handleMove(e) {
    if (!isEcuDrawing || !isEcuEditorMode) return;
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    const p = getEcuSvgCoordinates(svg, e);

    if (currentEcuDrawShape === 'lasso') {
      const lastPt = ecuLassoPoints[ecuLassoPoints.length - 1];
      if (!lastPt || Math.hypot(p.x - lastPt.x, p.y - lastPt.y) >= 4) {
        ecuLassoPoints.push({ x: p.x, y: p.y });
        if (lassoPreview) {
          const pathD = 'M ' + ecuLassoPoints.map(pt => `${pt.x} ${pt.y}`).join(' L ');
          lassoPreview.setAttribute('d', pathD);
        }
      }
    } else if (box) {
      const curX = Math.min(ecuDrawStartX, p.x);
      const curY = Math.min(ecuDrawStartY, p.y);
      const curW = Math.abs(p.x - ecuDrawStartX);
      const curH = Math.abs(p.y - ecuDrawStartY);

      box.setAttribute('x', curX);
      box.setAttribute('y', curY);
      box.setAttribute('width', curW);
      box.setAttribute('height', curH);
    }
  }

  function handleEnd(e) {
    if (!isEcuDrawing || !isEcuEditorMode) return;
    isEcuDrawing = false;
    if (box) box.style.display = 'none';
    if (lassoPreview) lassoPreview.style.display = 'none';

    if (currentEcuDrawShape === 'lasso') {
      if (ecuLassoPoints.length >= 4) {
        const pathD = 'M ' + ecuLassoPoints.map(pt => `${pt.x} ${pt.y}`).join(' L ') + ' Z';
        const xs = ecuLassoPoints.map(pt => pt.x);
        const ys = ecuLassoPoints.map(pt => pt.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const boxW = maxX - minX;
        const boxH = maxY - minY;
        const pinX = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
        const pinY = Math.round(ys.reduce((a, b) => a + b, 0) / ys.length);

        if (boxW > 12 && boxH > 12) {
          tempEcuBoxData = {
            isZone: true,
            type: 'polygon',
            pathD: pathD,
            points: ecuLassoPoints,
            x: minX,
            y: minY,
            width: boxW,
            height: boxH,
            pinX: pinX,
            pinY: pinY
          };

          drawChipPreviewSnapshot(minX, minY, boxW, boxH);

          const form = document.getElementById('formAdminAddEcuComponent');
          if (form) form.reset();

          const coordX = document.getElementById('adminEcuCoordX');
          const coordY = document.getElementById('adminEcuCoordY');
          const coordW = document.getElementById('adminEcuCoordW');
          const coordH = document.getElementById('adminEcuCoordH');
          const coordPinX = document.getElementById('adminEcuCoordPinX');
          const coordPinY = document.getElementById('adminEcuCoordPinY');
          if (coordX) coordX.value = minX;
          if (coordY) coordY.value = minY;
          if (coordW) coordW.value = boxW;
          if (coordH) coordH.value = boxH;
          if (coordPinX) coordPinX.value = pinX;
          if (coordPinY) coordPinY.value = pinY;

          const catEl = document.getElementById('adminEcuCompCategory');
          const tipoEl = document.getElementById('adminEcuCompTipo');
          if (catEl && tipoEl) {
            tipoEl.value = window.ECU_FRIENDLY_TYPES[catEl.value] || '';
          }

          const modalEl = document.getElementById('modalAdminAddEcuComponent');
          if (modalEl) {
            const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
            bsModal.show();
          }
        }
      }
    } else {
      const boxX = parseInt(box?.getAttribute('x') || 0);
      const boxY = parseInt(box?.getAttribute('y') || 0);
      const boxW = parseInt(box?.getAttribute('width') || 0);
      const boxH = parseInt(box?.getAttribute('height') || 0);

      if (boxW > 12 && boxH > 12) {
        tempEcuBoxData = {
          isZone: false,
          type: 'rect',
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          pinX: Math.round(boxX + boxW / 2),
          pinY: Math.round(boxY + boxH / 2)
        };

        drawChipPreviewSnapshot(boxX, boxY, boxW, boxH);

        const form = document.getElementById('formAdminAddEcuComponent');
        if (form) form.reset();

        const coordX = document.getElementById('adminEcuCoordX');
        const coordY = document.getElementById('adminEcuCoordY');
        const coordW = document.getElementById('adminEcuCoordW');
        const coordH = document.getElementById('adminEcuCoordH');
        const coordPinX = document.getElementById('adminEcuCoordPinX');
        const coordPinY = document.getElementById('adminEcuCoordPinY');
        if (coordX) coordX.value = boxX;
        if (coordY) coordY.value = boxY;
        if (coordW) coordW.value = boxW;
        if (coordH) coordH.value = boxH;
        if (coordPinX) coordPinX.value = Math.round(boxX + boxW / 2);
        if (coordPinY) coordPinY.value = Math.round(boxY + boxH / 2);

        const catEl = document.getElementById('adminEcuCompCategory');
        const tipoEl = document.getElementById('adminEcuCompTipo');
        if (catEl && tipoEl) {
          tipoEl.value = window.ECU_FRIENDLY_TYPES[catEl.value] || '';
        }

        const modalEl = document.getElementById('modalAdminAddEcuComponent');
        if (modalEl) {
          const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
          bsModal.show();
        }
      }
    }
  }

  svg.addEventListener('mousedown', handleStart);
  svg.addEventListener('touchstart', handleStart, { passive: false });

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('touchmove', handleMove, { passive: false });

  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('touchend', handleEnd, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isEcuEditorMode) {
      window.cancelAdminEcuDrawing();
    }
  });
}

// --- ADMIN GALLERY REORDER & MULTI-PHOTO MANAGEMENT CONTROLLER ---

let currentEditingGalleryList = [];

window.openAdminGalleryReorderModal = function(e) {
  if (e) e.preventDefault();

  const user = window.probaktronicCurrentUser;
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
    ? window.isProbaktronicAdmin() 
    : (user && (user.email === 'prueba@probak.com' || user.rol === 'admin' || user.isAdmin === true));

  if (!isAdmin) {
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('Acceso exclusivo para administradores.');
    }
    return;
  }

  currentEditingGalleryList = [...(currentGalleryImages || [])];
  if (currentEditingGalleryList.length === 0 && window._currentActiveDiagramData) {
    const single = window._currentActiveDiagramData.imageUrl || window._currentActiveDiagramData.url;
    if (single) currentEditingGalleryList = [single];
  }

  renderAdminGalleryReorderList();

  const modalEl = document.getElementById('adminGalleryReorderModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

function renderAdminGalleryReorderList() {
  const container = document.getElementById('adminGalleryReorderListContainer');
  const countEl = document.getElementById('adminGalleryTotalCount');
  if (!container) return;

  if (countEl) countEl.textContent = currentEditingGalleryList.length;

  if (currentEditingGalleryList.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted p-4 border rounded-3 bg-light">
        <i class="bi bi-images fs-2 d-block mb-1 text-secondary"></i>
        <div class="fw-bold">No hay fotos en esta galería</div>
        <div class="small">Sube fotos usando el botón superior "+ Subir Otra Foto".</div>
      </div>
    `;
    return;
  }

  container.innerHTML = currentEditingGalleryList.map((src, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === currentEditingGalleryList.length - 1;
    const fileName = (src.includes('/') ? src.split('/').pop() : src).split('?')[0];
    return `
      <div class="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white shadow-sm gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="badge ${isFirst ? 'bg-danger' : 'bg-secondary'} rounded-pill px-3 py-2 font-rajdhani fw-bold" style="font-size: 0.85rem; min-width: 85px; text-align: center;">
            ${isFirst ? '⭐ Foto 1' : `Foto ${idx + 1}`}
          </div>
          <div class="border rounded-2 p-1 bg-dark d-flex align-items-center justify-content-center shadow-sm" style="width: 60px; height: 60px; flex-shrink: 0; overflow: hidden;">
            <img src="${src}" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </div>
          <div class="d-flex flex-column">
            <span class="fw-bold text-dark font-rajdhani small">${isFirst ? 'FOTO PRINCIPAL (PORTADA)' : `FOTO SECUNDARIA #${idx + 1}`}</span>
            <span class="text-muted text-truncate" style="font-size: 0.72rem; max-width: 220px;">${fileName}</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          ${!isFirst ? `
            <button type="button" class="btn btn-outline-warning btn-sm fw-bold font-rajdhani" onclick="makeGalleryPhotoPrimary(${idx})" title="Establecer como Foto 1 / Portada">
              <i class="bi bi-star-fill me-1"></i> Portada
            </button>
          ` : ''}
          <button type="button" class="btn btn-outline-secondary btn-sm ${isFirst ? 'disabled' : ''}" onclick="moveGalleryPhoto(${idx}, -1)" title="Mover hacia arriba / antes">
            <i class="bi bi-arrow-up"></i>
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm ${isLast ? 'disabled' : ''}" onclick="moveGalleryPhoto(${idx}, 1)" title="Mover hacia abajo / después">
            <i class="bi bi-arrow-down"></i>
          </button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeGalleryPhoto(${idx})" title="Eliminar foto de este componente">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.moveGalleryPhoto = function(idx, delta) {
  const targetIdx = idx + delta;
  if (targetIdx < 0 || targetIdx >= currentEditingGalleryList.length) return;
  const temp = currentEditingGalleryList[idx];
  currentEditingGalleryList[idx] = currentEditingGalleryList[targetIdx];
  currentEditingGalleryList[targetIdx] = temp;
  renderAdminGalleryReorderList();
};

window.makeGalleryPhotoPrimary = function(idx) {
  if (idx <= 0 || idx >= currentEditingGalleryList.length) return;
  const item = currentEditingGalleryList.splice(idx, 1)[0];
  currentEditingGalleryList.unshift(item);
  renderAdminGalleryReorderList();
};

window.removeGalleryPhoto = function(idx) {
  if (idx < 0 || idx >= currentEditingGalleryList.length) return;
  if (confirm(`¿Deseas quitar esta foto (Foto ${idx + 1}) de la galería?`)) {
    currentEditingGalleryList.splice(idx, 1);
    renderAdminGalleryReorderList();
  }
};

window.handleAdminUploadNewGalleryPhoto = function(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      currentEditingGalleryList.push(e.target.result);
      renderAdminGalleryReorderList();
      input.value = '';
    };
    reader.readAsDataURL(file);
  }
};

window.saveAdminGalleryOrder = async function() {
  if (currentEditingGalleryList.length === 0) {
    alert('Debe haber al menos 1 imagen en la galería.');
    return;
  }

  const newOrder = [...currentEditingGalleryList];
  currentGalleryImages = newOrder;

  if (window._currentActiveDiagramData) {
    window._currentActiveDiagramData.allImages = newOrder;
    window._currentActiveDiagramData.imagenes = newOrder;
    window._currentActiveDiagramData.imageUrl = newOrder[0];
    if (!window._currentActiveDiagramData.url || !window._currentActiveDiagramData.url.toLowerCase().includes('.pdf')) {
      window._currentActiveDiagramData.imageUrl = newOrder[0];
    }
  }

  // Update in Firestore
  try {
    const db = firebase.firestore();
    const active = window._currentActiveDiagramData || {};
    const archDoc = active._selectedArchDoc || {};

    if (archDoc.brandDocId && archDoc.modelDocId && archDoc.anioDocId && archDoc.motorDocId && archDoc.archDocId) {
      const updateData = {
        imagenes: newOrder,
        allImages: newOrder,
        imageUrl: newOrder[0]
      };
      await db.collection('diagramas').doc(archDoc.brandDocId.toLowerCase().trim())
        .collection('modelos').doc(archDoc.modelDocId.toLowerCase().trim())
        .collection('anios').doc(archDoc.anioDocId)
        .collection('motores').doc(archDoc.motorDocId)
        .collection('archivos').doc(archDoc.archDocId).set(updateData, { merge: true });
    }
  } catch (e) {
    console.warn('Nota guardando orden en Firestore:', e);
  }

  // Live reload on viewer
  window.renderGalleryPagination(newOrder);
  window.showGalleryImageAtIndex(0);

  // Close Modal
  const modalEl = document.getElementById('adminGalleryReorderModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast('¡Orden de fotos actualizado y guardado correctamente!');
  }
};

// --- ADMIN DIRECT PHOTO UPLOAD & FIREBASE HIERARCHICAL SYNC CONTROLLER ---

let adminDirectSelectedPhotoFile = null;

window.openAdminAddPhotoDirectModal = function(e) {
  if (e) e.preventDefault();

  const user = window.probaktronicCurrentUser;
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
    ? window.isProbaktronicAdmin() 
    : (user && (user.email === 'prueba@probak.com' || user.rol === 'admin' || user.isAdmin === true));

  if (!isAdmin) {
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('Acceso exclusivo para administradores.');
    }
    return;
  }

  const active = window._currentActiveDiagramData || {};
  const archDoc = active._selectedArchDoc || {};
  const currentCount = (currentGalleryImages && currentGalleryImages.length) || 1;

  // Set modal UI labels
  const fuelEl = document.getElementById('adminAddPhotoContextFuel');
  const countEl = document.getElementById('adminAddPhotoContextCurrentCount');
  const vehicleEl = document.getElementById('adminAddPhotoContextVehicle');
  const compEl = document.getElementById('adminAddPhotoContextComponent');
  const endDescEl = document.getElementById('adminPhotoPosEndDesc');
  const fileNameText = document.getElementById('adminDirectPhotoFileNameText');
  const previewWrap = document.getElementById('adminDirectPhotoPreviewWrap');
  const progressWrap = document.getElementById('adminDirectPhotoProgressWrap');
  const form = document.getElementById('formAdminAddPhotoDirect');

  if (form) form.reset();
  if (fileNameText) fileNameText.textContent = 'Haz clic para elegir una imagen';
  if (previewWrap) previewWrap.classList.add('d-none');
  if (progressWrap) progressWrap.classList.add('d-none');
  adminDirectSelectedPhotoFile = null;

  if (fuelEl) fuelEl.textContent = (currentSelectedFuelType || 'diesel').toUpperCase();
  if (countEl) countEl.textContent = `${currentCount} foto${currentCount > 1 ? 's' : ''} registrada${currentCount > 1 ? 's' : ''} actualmente`;
  
  const b = currentSelectedBrandName || archDoc.brandDocId || 'Toyota';
  const m = document.getElementById('selectedVehicleModelText')?.textContent || archDoc.modelDocId || 'Vehículo';
  const y = document.getElementById('selectedVehicleSpecText')?.textContent || archDoc.motorDocId || '';
  if (vehicleEl) vehicleEl.textContent = `${b.toUpperCase()} ${m.toUpperCase()} ${y.toUpperCase()}`.trim();

  const compTitle = active.tituloArchivo || archDoc.titulo || 'IMAGEN DEL COMPONENTE / ECU';
  if (compEl) compEl.textContent = compTitle.toUpperCase();

  if (endDescEl) endDescEl.textContent = `Se guardará como Foto ${currentCount + 1}`;

  const modalEl = document.getElementById('adminAddPhotoDirectModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

window.handleAdminDirectPhotoFileChange = function(input) {
  const fileNameText = document.getElementById('adminDirectPhotoFileNameText');
  const previewWrap = document.getElementById('adminDirectPhotoPreviewWrap');
  const previewImg = document.getElementById('adminDirectPhotoPreviewImg');

  if (input.files && input.files[0]) {
    adminDirectSelectedPhotoFile = input.files[0];
    if (fileNameText) fileNameText.textContent = input.files[0].name;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.classList.remove('d-none');
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.handleAdminSubmitDirectPhoto = async function(e) {
  if (e) e.preventDefault();

  if (!adminDirectSelectedPhotoFile) {
    alert('Por favor selecciona una imagen primero.');
    return;
  }

  const btnSubmit = document.getElementById('btnAdminSubmitDirectPhoto');
  const progressWrap = document.getElementById('adminDirectPhotoProgressWrap');
  const progressBar = document.getElementById('adminDirectPhotoProgressBar');
  const statusText = document.getElementById('adminDirectPhotoStatusText');

  if (btnSubmit) btnSubmit.disabled = true;
  if (progressWrap) progressWrap.classList.remove('d-none');
  if (progressBar) progressBar.style.width = '15%';
  if (statusText) statusText.textContent = 'Subiendo a Firebase Storage...';

  try {
    const active = window._currentActiveDiagramData || {};
    const archDoc = active._selectedArchDoc || {};

    const brandDocId = (archDoc.brandDocId || currentSelectedBrandId || 'toyota').toLowerCase().trim();
    const modelDocId = (archDoc.modelDocId || currentSelectedModelDocId || 'modelo').toLowerCase().trim();
    const anioDocId = archDoc.anioDocId || 'estandar';
    const motorDocId = (archDoc.motorDocId || 'estandar').toLowerCase().trim();
    const archDocId = archDoc.archDocId || active.id || 'ecu';

    // 1. Upload to Firebase Storage with clean structured path
    const timestamp = Date.now();
    const cleanFileName = adminDirectSelectedPhotoFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storagePath = `diagramas/${brandDocId}/${modelDocId}/${motorDocId}/fotos_galeria/${timestamp}_${cleanFileName}`;
    
    let fileDownloadUrl = '';
    const storage = firebase.storage();
    const storageRef = storage.ref(storagePath);
    
    const isSvg = adminDirectSelectedPhotoFile.name.toLowerCase().endsWith('.svg');
    const metadata = isSvg ? { contentType: 'image/svg+xml' } : {};

    const uploadTask = storageRef.put(adminDirectSelectedPhotoFile, metadata);

    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 75) + 15;
          if (progressBar) progressBar.style.width = `${progress}%`;
        },
        (error) => reject(error),
        async () => {
          fileDownloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          resolve();
        }
      );
    });

    if (progressBar) progressBar.style.width = '90%';
    if (statusText) statusText.textContent = 'Actualizando documento en Firestore...';

    // 2. Determine Position: Add to End or Make Primary Cover (Foto 1)
    const posChoice = document.querySelector('input[name="adminPhotoPosition"]:checked')?.value || 'end';
    let newGallery = [...(currentGalleryImages || [])];
    if (newGallery.length === 0 && (active.imageUrl || active.url)) {
      newGallery = [active.imageUrl || active.url];
    }

    if (posChoice === 'first') {
      newGallery.unshift(fileDownloadUrl);
    } else {
      newGallery.push(fileDownloadUrl);
    }

    // 3. Save to Firestore under exact hierarchical path
    const db = firebase.firestore();
    const docRef = db.collection('diagramas').doc(brandDocId)
      .collection('modelos').doc(modelDocId)
      .collection('anios').doc(anioDocId)
      .collection('motores').doc(motorDocId)
      .collection('archivos').doc(archDocId);

    const updatePayload = {
      imagenes: newGallery,
      allImages: newGallery,
      ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (posChoice === 'first') {
      updatePayload.imageUrl = fileDownloadUrl;
    }

    await docRef.set(updatePayload, { merge: true });

    if (progressBar) progressBar.style.width = '100%';
    if (statusText) statusText.textContent = '¡Foto vinculada con éxito!';

    // 4. Update live state & reload gallery in viewer
    currentGalleryImages = newGallery;
    if (window._currentActiveDiagramData) {
      window._currentActiveDiagramData.allImages = newGallery;
      window._currentActiveDiagramData.imagenes = newGallery;
      if (posChoice === 'first') {
        window._currentActiveDiagramData.imageUrl = fileDownloadUrl;
      }
    }

    window.renderGalleryPagination(newGallery);
    const newActiveIndex = (posChoice === 'first') ? 0 : (newGallery.length - 1);
    window.showGalleryImageAtIndex(newActiveIndex);

    // 5. Close Modal & Reset Form
    setTimeout(() => {
      const modalEl = document.getElementById('adminAddPhotoDirectModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      }
      if (form) form.reset();
      adminDirectSelectedPhotoFile = null;
      if (btnSubmit) btnSubmit.disabled = false;
      if (progressWrap) progressWrap.classList.add('d-none');
    }, 600);

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('¡Nueva foto agregada y organizada con éxito en Firebase!');
    }
  } catch (err) {
    console.error('Error subiendo foto directa:', err);
    alert('Error al subir la foto a Firebase: ' + err.message);
    if (btnSubmit) btnSubmit.disabled = false;
    if (progressWrap) progressWrap.classList.add('d-none');
  }
};

// --- ADMIN ADD BRAND CONTROLLER ---
let adminNewBrandCustomLogoData = null;

window.openAdminAddBrandModal = function() {
  const form = document.getElementById('formAdminAddBrand');
  const preview = document.getElementById('adminNewBrandLogoPreview');
  const statusBadge = document.getElementById('adminNewBrandLogoStatusBadge');
  const sourceText = document.getElementById('adminNewBrandLogoSourceText');
  const fuelSelect = document.getElementById('adminNewBrandFuelSelect');
  const catSelect = document.getElementById('adminNewBrandCategorySelect');

  if (form) form.reset();
  adminNewBrandCustomLogoData = null;

  if (fuelSelect && currentSelectedFuelType) fuelSelect.value = currentSelectedFuelType;
  if (catSelect && currentSelectedCategoryKey) catSelect.value = currentSelectedCategoryKey;

  if (preview) preview.src = 'logo_probaktronic_solo.png';
  if (statusBadge) { statusBadge.className = 'badge bg-secondary small font-rajdhani'; statusBadge.textContent = 'Escribe un nombre para detectar logo'; }
  if (sourceText) sourceText.textContent = 'Logo por defecto';

  const modalEl = document.getElementById('adminAddBrandModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
};

window.handleAdminBrandNameLiveSearch = function(brandName) {
  if (adminNewBrandCustomLogoData) return; // Custom logo uploaded, don't overwrite

  const preview = document.getElementById('adminNewBrandLogoPreview');
  const statusBadge = document.getElementById('adminNewBrandLogoStatusBadge');
  const sourceText = document.getElementById('adminNewBrandLogoSourceText');

  const clean = (brandName || '').trim().toLowerCase();
  const logoUrl = getBrandLogoUrl(clean);

  if (preview) preview.src = logoUrl;
  if (logoUrl !== 'logo_probaktronic_solo.png') {
    if (statusBadge) { statusBadge.className = 'badge bg-success small font-rajdhani'; statusBadge.textContent = '✓ Logo oficial detectado'; }
    if (sourceText) sourceText.textContent = `Logo oficial SVG de ${brandName.toUpperCase()}`;
  } else {
    if (statusBadge) { statusBadge.className = 'badge bg-warning text-dark small font-rajdhani'; statusBadge.textContent = 'Sin logo oficial (Usa logo genérico o sube uno)'; }
    if (sourceText) sourceText.textContent = 'Logo genérico Probaktronic';
  }
};

window.handleAdminNewBrandLogoFileChange = function(input) {
  const preview = document.getElementById('adminNewBrandLogoPreview');
  const statusBadge = document.getElementById('adminNewBrandLogoStatusBadge');
  const sourceText = document.getElementById('adminNewBrandLogoSourceText');

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      adminNewBrandCustomLogoData = e.target.result;
      if (preview) preview.src = adminNewBrandCustomLogoData;
      if (statusBadge) { statusBadge.className = 'badge bg-primary small font-rajdhani'; statusBadge.textContent = '★ Logo personalizado cargado'; }
      if (sourceText) sourceText.textContent = `Archivo: ${file.name}`;
    };
    reader.readAsDataURL(file);
  }
};

window.handleAdminSubmitNewBrand = async function(e) {
  if (e) e.preventDefault();

  const brandName = (document.getElementById('adminNewBrandNameInput')?.value || '').trim();
  if (!brandName) {
    alert('Ingresa el nombre de la marca.');
    return;
  }

  const fuel = document.getElementById('adminNewBrandFuelSelect')?.value || 'diesel';
  const category = document.getElementById('adminNewBrandCategorySelect')?.value || 'pickup';
  const btn = document.getElementById('btnAdminSubmitNewBrand');
  const statusMsg = document.getElementById('adminNewBrandStatusMsg');

  if (btn) btn.disabled = true;
  if (statusMsg) { statusMsg.className = 'small text-center fw-bold text-primary'; statusMsg.textContent = 'Guardando marca en Firebase Firestore...'; }

  try {
    const cleanDocId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let finalLogoUrl = adminNewBrandCustomLogoData || getBrandLogoUrl(cleanDocId);

    // If custom SVG/PNG was chosen, optionally upload to storage
    const fileInput = document.getElementById('adminNewBrandLogoFileInput');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const storageRef = firebase.storage().ref(`diagramas/logos_marcas/${cleanDocId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`);
      const isSvg = file.name.toLowerCase().endsWith('.svg');
      const snap = await storageRef.put(file, isSvg ? { contentType: 'image/svg+xml' } : {});
      finalLogoUrl = await snap.ref.getDownloadURL();
    }

    const db = firebase.firestore();
    await db.collection('diagramas').doc(cleanDocId).set({
      nombre: brandName.toUpperCase(),
      marca: brandName.toUpperCase(),
      logo: finalLogoUrl,
      combustible: fuel,
      categoria: category,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (statusMsg) { statusMsg.className = 'small text-center fw-bold text-success'; statusMsg.textContent = '¡Marca registrada con éxito!'; }

    setTimeout(() => {
      const modalEl = document.getElementById('adminAddBrandModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }
      if (btn) btn.disabled = false;

      // Reload brands grid
      const grid = document.getElementById('vehiculosBrandGrid');
      if (grid) loadFirestoreDiagramasBrands(grid);

      if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(`¡Marca ${brandName.toUpperCase()} registrada con éxito!`);
      }
    }, 600);
  } catch (err) {
    console.error('Error creando marca:', err);
    alert('Error al guardar la marca en Firebase: ' + err.message);
    if (btn) btn.disabled = false;
  }
};


// --- ADMIN ADD MODEL CONTROLLER ---
let adminNewModelCustomPhotoData = null;

window.openAdminAddModelModal = function(brandName) {
  const form = document.getElementById('formAdminAddModel');
  const brandText = document.getElementById('adminNewModelParentBrandText');
  const fuelSelect = document.getElementById('adminNewModelFuelSelect');
  const preview = document.getElementById('adminNewModelPhotoPreview');
  const statusBadge = document.getElementById('adminNewModelPhotoStatusBadge');
  const sourceText = document.getElementById('adminNewModelPhotoSourceText');

  if (form) form.reset();
  adminNewModelCustomPhotoData = null;

  const targetBrand = brandName || currentSelectedBrandName || 'TOYOTA';
  if (brandText) brandText.textContent = targetBrand.toUpperCase();

  if (fuelSelect && currentSelectedFuelType) fuelSelect.value = currentSelectedFuelType;

  // Set default photo
  const detectedPhoto = getVehicleCarPhotoUrl(targetBrand, '', '') || 'imagenes autos/ic_car_toyota_hilux.JPG';
  if (preview) preview.src = detectedPhoto;
  if (statusBadge) { statusBadge.className = 'badge bg-success small font-rajdhani'; statusBadge.textContent = 'Foto sugerida lista'; }
  if (sourceText) sourceText.textContent = 'Foto sugerida para la marca';

  const modalEl = document.getElementById('adminAddModelModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
};

window.handleAdminModelNameLiveSearch = function(modelName) {
  if (adminNewModelCustomPhotoData) return;

  const targetBrand = (document.getElementById('adminNewModelParentBrandText')?.textContent || currentSelectedBrandName || 'TOYOTA').trim();
  const years = (document.getElementById('adminNewModelYearsInput')?.value || '').trim();
  const preview = document.getElementById('adminNewModelPhotoPreview');
  const statusBadge = document.getElementById('adminNewModelPhotoStatusBadge');
  const sourceText = document.getElementById('adminNewModelPhotoSourceText');

  const detectedPhoto = getVehicleCarPhotoUrl(targetBrand, `${modelName} ${years}`, modelName);
  if (detectedPhoto) {
    if (preview) preview.src = detectedPhoto;
    if (statusBadge) { statusBadge.className = 'badge bg-success small font-rajdhani'; statusBadge.textContent = '✓ Foto oficial detectada'; }
    if (sourceText) sourceText.textContent = `Foto oficial encontrada para ${modelName.toUpperCase()}`;
  }
};

window.handleAdminNewModelCarFileChange = function(input) {
  const preview = document.getElementById('adminNewModelPhotoPreview');
  const statusBadge = document.getElementById('adminNewModelPhotoStatusBadge');
  const sourceText = document.getElementById('adminNewModelPhotoSourceText');

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      adminNewModelCustomPhotoData = e.target.result;
      if (preview) preview.src = adminNewModelCustomPhotoData;
      if (statusBadge) { statusBadge.className = 'badge bg-primary small font-rajdhani'; statusBadge.textContent = '★ Foto personalizada cargada'; }
      if (sourceText) sourceText.textContent = `Archivo: ${file.name}`;
    };
    reader.readAsDataURL(file);
  }
};

window.handleAdminSubmitNewModel = async function(e) {
  if (e) e.preventDefault();

  const brandName = (document.getElementById('adminNewModelParentBrandText')?.textContent || currentSelectedBrandName || 'TOYOTA').trim();
  const modelName = (document.getElementById('adminNewModelNameInput')?.value || '').trim();
  const years = (document.getElementById('adminNewModelYearsInput')?.value || '').trim();
  const motor = (document.getElementById('adminNewModelMotorInput')?.value || 'Estándar').trim();
  const fuel = document.getElementById('adminNewModelFuelSelect')?.value || 'diesel';

  if (!modelName) {
    alert('Ingresa el nombre del modelo.');
    return;
  }

  const btn = document.getElementById('btnAdminSubmitNewModel');
  const statusMsg = document.getElementById('adminNewModelStatusMsg');

  if (btn) btn.disabled = true;
  if (statusMsg) { statusMsg.className = 'small text-center fw-bold text-primary'; statusMsg.textContent = 'Guardando modelo en Firebase Firestore...'; }

  try {
    const brandDocId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const modelDocId = modelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const anioDocId = years ? years.trim() : 'estandar';
    const motorDocId = motor.toLowerCase().replace(/[^a-z0-9]/g, '') || 'estandar';
    const fullModelTitle = `${brandName.toUpperCase()} ${modelName.toUpperCase()} ${years}`.trim();

    let finalCarPhotoUrl = adminNewModelCustomPhotoData || getVehicleCarPhotoUrl(brandName, `${modelName} ${years}`, modelDocId) || 'imagenes autos/ic_car_toyota_hilux.JPG';

    // Upload custom photo if selected
    const fileInput = document.getElementById('adminNewModelCarFileInput');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const storageRef = firebase.storage().ref(`diagramas/fotos_modelos/${brandDocId}_${modelDocId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`);
      const isSvg = file.name.toLowerCase().endsWith('.svg');
      const snap = await storageRef.put(file, isSvg ? { contentType: 'image/svg+xml' } : {});
      finalCarPhotoUrl = await snap.ref.getDownloadURL();
    }

    const db = firebase.firestore();

    // 1. Ensure Brand Doc exists
    await db.collection('diagramas').doc(brandDocId).set({
      nombre: brandName.toUpperCase(),
      marca: brandName.toUpperCase(),
      logo: getBrandLogoUrl(brandDocId),
      combustible: fuel
    }, { merge: true });

    // 2. Set Model Doc
    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId).set({
      modelo: fullModelTitle,
      nombre: modelName.toUpperCase(),
      motor: motor,
      combustible: fuel,
      imagen: finalCarPhotoUrl,
      anios: years,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Set Year & Motor Doc
    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId)
      .collection('anios').doc(anioDocId).set({ anio: anioDocId }, { merge: true });

    await db.collection('diagramas').doc(brandDocId).collection('modelos').doc(modelDocId)
      .collection('anios').doc(anioDocId).collection('motores').doc(motorDocId).set({
        motor: motor,
        combustible: fuel,
        modelo: fullModelTitle,
        imagen: finalCarPhotoUrl
      }, { merge: true });

    if (statusMsg) { statusMsg.className = 'small text-center fw-bold text-success'; statusMsg.textContent = '¡Modelo registrado con éxito!'; }

    setTimeout(() => {
      const modalEl = document.getElementById('adminAddModelModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }
      if (btn) btn.disabled = false;

      // Reload models list for this brand
      const modelsListGrid = document.getElementById('modelsListGrid');
      if (modelsListGrid) {
        window.openBrandDiagramModels(brandDocId, brandName, getBrandLogoUrl(brandDocId), 'diagramas');
      }

      if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(`¡Modelo ${fullModelTitle} registrado con éxito!`);
      }
    }, 600);
  } catch (err) {
    console.error('Error creando modelo:', err);
    alert('Error al guardar el modelo en Firebase: ' + err.message);
    if (btn) btn.disabled = false;
  }
};




