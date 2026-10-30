sap.ui.define([], function () {
  "use strict";

  /*
   * Every entry becomes a path that can be bound in an XML view:
   *
   *   name: sql(`SELECT …`)       many rows → items="{/name}" or data="{/name}"
   *   name: sql.one(`SELECT …`)   one row  → {/name/column}
   *
   * Develop the query in the deployed Query Playground, paste it between
   * the markers below, save, and refresh this app.
   * Name calculated columns with AS so they can be bound in XML.
   */
  return function (sql) {
    return {
      membersByClub: sql(`
        SELECT name, members
        FROM clubs
        ORDER BY members DESC
      `),

      // 🧩 YOUR QUERIES START
      kpis: sql.one(`
        SELECT 
          ROUND(AVG(CASE WHEN weekday = 'Thu' THEN showup_pct END)) AS thu_showup,
          ROUND(AVG(CASE WHEN weekday = 'Fri' THEN showup_pct END)) AS fri_showup,
          ROUND(AVG(CASE WHEN topic = 'Workshop' THEN avg_rating END), 1) AS workshop_rating,
          (SELECT sponsor FROM clubs WHERE club_id = 'C01') AS sponsor
        FROM events
        WHERE club_id = 'C01'
      `),

      showupByWeekday: sql(`
        SELECT 
          weekday,
          ROUND(AVG(showup_pct)) AS showup_pct,
          ROUND(AVG(fill_pct)) AS fill_pct,
          COUNT(*) AS total_events
        FROM events
        WHERE club_id = 'C01'
        GROUP BY weekday
        ORDER BY CASE weekday
          WHEN 'Wed' THEN 1
          WHEN 'Thu' THEN 2
          WHEN 'Fri' THEN 3
        END
      `),

      weeklyTrend: sql(`
        SELECT 
          week,
          ROUND(AVG(fill_pct)) AS fill_pct,
          ROUND(AVG(showup_pct)) AS showup_pct
        FROM events
        WHERE club_id = 'C01'
        GROUP BY week
        ORDER BY week
      `),

      topicComparison: sql(`
        SELECT 
          topic,
          COUNT(*) AS events,
          ROUND(AVG(registered)) AS avg_registered,
          ROUND(AVG(checked_in)) AS avg_checked_in,
          ROUND(AVG(avg_rating), 1) AS avg_rating,
          ROUND(AVG(showup_pct)) AS avg_showup
        FROM events
        WHERE club_id = 'C01'
        GROUP BY topic
        ORDER BY avg_rating DESC
      `),

      workshopByDay: sql(`
        SELECT 
          weekday,
          ROUND(AVG(showup_pct)) AS showup_pct,
          ROUND(AVG(fill_pct)) AS fill_pct,
          ROUND(AVG(avg_rating), 1) AS rating,
          COUNT(*) AS count
        FROM events
        WHERE club_id = 'C01' AND topic = 'Workshop'
        GROUP BY weekday
        ORDER BY CASE weekday
          WHEN 'Wed' THEN 1
          WHEN 'Thu' THEN 2
          WHEN 'Fri' THEN 3
        END
      `),

      nextSemesterM105: sql(`
        SELECT room, weekday, start_time, end_time, booked_by
        FROM room_bookings
        WHERE room = 'M105'
        ORDER BY weekday
      `)
      // 🧩 YOUR QUERIES END
    };
  };
});
