/**
 * Configuration globale du bot TFRP
 */
export const BOT_CONFIG = {
  MAIN_SERVER_ID: "1279455759414857759",
  LOG_CHANNEL_ID: "1450962428492775505",
  CUSTOMS_CHANNEL_ID: "1454245706842771690",
  SITE_URL: "https://x-bananous.github.io/tfrp/",
  EMBED_COLOR: 0x00008B, // Bleu foncé
  
  VERIFIED_ROLE_IDS: [
    "1450941712938696845",
    "1445853668246163668"
  ],
  UNVERIFIED_ROLE_ID: "1445853684696223846",
  
  // Mapping strict Permissions Site -> IDs de Rôles Discord
  PERM_ROLE_MAP: {
    "can_approve_characters": "1445853687573385259", // Whitelist [PS]
    "can_manage_characters": "1454487849574465680",  // Personnage [PS]
    "can_manage_economy": "1454487850132308109",     // Economie [PS]
    "can_manage_illegal": "1454487850899869726",     // Illégal [PS]
    "can_manage_enterprises": "1454487851126489099", // Commerce [PS]
    "can_manage_staff": "1454487852342706187",       // Directoire [PS]
    "can_manage_inventory": "1454487852447695114",   // S.Objet [PS]
    "can_change_team": "1454487852716130355",        // Secteurs [PS]
    "can_go_onduty": "1454487853898928274",          // Service [PS]
    "can_manage_jobs": "1454487853923832074",         // Métier [PS]
    "can_bypass_login": "1454488526405111963",       // A.Fondation [PS]
    "can_launch_session": "1454488527483179042",     // Session [PS]
    "can_execute_commands": "1454488529177673856",   // C.ERLC [PS]
    "can_give_wheel_turn": "1454488530490228829",    // Roues [PS]
    "can_use_dm": "1454488531341938841",             // Messagerie [PS]
    "can_use_say": "1454488532197310475",             // Transmission [PS]
    
    // PERMISSIONS MODÉRATION (Mise à jour avec les IDs fournis)
    "can_warn": "1454617528411095071",
    "can_mute": "1454617655162966016",
    "can_ban": "1454617714604642506"
  }
};