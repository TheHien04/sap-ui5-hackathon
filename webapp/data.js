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

      codingClubEvents: sql(`
        SELECT date, title, topic, registered, checked_in, capacity
        FROM events
        WHERE club_id = 'C01'
        ORDER BY date
      `),

      eventsByClub: sql(`
        SELECT c.name AS club, COUNT(*) AS events
        FROM events e
        JOIN clubs c ON c.club_id = e.club_id
        GROUP BY c.club_id, c.name
        ORDER BY events DESC, club DESC
      `),

      // 🧩 YOUR QUERIES START

      decisionSummary: sql.one(`
        SELECT
          ROUND(100.0 * SUM(CASE WHEN weekday = 'Fri' THEN registered ELSE 0 END) /
            SUM(CASE WHEN weekday = 'Fri' THEN capacity ELSE 0 END), 1) AS friday_registration,
          ROUND(100.0 * SUM(CASE WHEN weekday = 'Fri' THEN checked_in ELSE 0 END) /
            SUM(CASE WHEN weekday = 'Fri' THEN registered ELSE 0 END), 1) AS friday_showup,
          ROUND(100.0 * SUM(CASE WHEN weekday = 'Fri' THEN checked_in ELSE 0 END) /
            SUM(CASE WHEN weekday = 'Fri' THEN capacity ELSE 0 END), 1) AS friday_fill,
          SUM(CASE WHEN weekday = 'Fri' THEN registered - checked_in ELSE 0 END) AS friday_no_shows,
          SUM(CASE WHEN weekday <> 'Fri' THEN registered - checked_in ELSE 0 END) AS midweek_no_shows,
          ROUND(AVG(CASE WHEN weekday = 'Fri' THEN avg_rating END), 1) AS friday_rating,
          ROUND(100.0 * SUM(CASE WHEN weekday <> 'Fri' THEN checked_in ELSE 0 END) /
            SUM(CASE WHEN weekday <> 'Fri' THEN registered ELSE 0 END), 1) AS midweek_showup
        FROM events
        WHERE club_id = 'C01'
      `),

      attendanceJourney: sql(`
        SELECT
          CASE WHEN weekday = 'Fri' THEN 'Friday 18:30' ELSE 'Midweek 18:00' END AS slot,
          CASE WHEN weekday = 'Fri' THEN 2 ELSE 1 END AS sort_order,
          ROUND(100.0 * SUM(registered) / SUM(capacity), 1) AS registered_pct,
          ROUND(100.0 * SUM(checked_in) / SUM(capacity), 1) AS checked_in_pct
        FROM events
        WHERE club_id = 'C01'
        GROUP BY slot
        ORDER BY sort_order
      `),

      workshopTiming: sql(`
        SELECT
          CASE WHEN weekday = 'Fri' THEN 'Friday' ELSE 'Midweek' END AS slot,
          CASE WHEN weekday = 'Fri' THEN 2 ELSE 1 END AS sort_order,
          COUNT(*) AS event_count,
          ROUND(AVG(fill_pct), 1) AS avg_fill,
          ROUND(AVG(showup_pct), 1) AS avg_showup,
          ROUND(AVG(avg_rating), 2) AS avg_rating
        FROM events
        WHERE club_id = 'C01' AND topic = 'Workshop'
        GROUP BY slot
        ORDER BY sort_order
      `),

      crossClubFriday: sql(`
        SELECT
          c.name AS club,
          ROUND(AVG(CASE WHEN e.weekday = 'Fri' THEN e.fill_pct END), 1) AS friday_fill,
          ROUND(AVG(CASE WHEN e.weekday <> 'Fri' THEN e.fill_pct END), 1) AS weekday_fill
        FROM clubs c
        JOIN events e ON e.club_id = c.club_id
        GROUP BY c.club_id, c.name
        HAVING COUNT(CASE WHEN e.weekday = 'Fri' THEN 1 END) > 0
        ORDER BY c.name
      `),

      pilotImpact: sql.one(`
        SELECT
          4 AS pilot_events,
          75 AS target_fill,
          80 AS target_showup,
          ROUND(
            AVG(CASE WHEN weekday = 'Fri' THEN registered END) *
            (1.0 * SUM(CASE WHEN weekday <> 'Fri' THEN checked_in ELSE 0 END) /
              SUM(CASE WHEN weekday <> 'Fri' THEN registered ELSE 0 END)) -
            AVG(CASE WHEN weekday = 'Fri' THEN checked_in END),
            0
          ) AS extra_checkins_per_event
        FROM events
        WHERE club_id = 'C01'
      `),

      summary: sql.one(`
        SELECT
          ROUND(AVG(CASE WHEN weekday = 'Fri' THEN fill_pct END), 1) AS friday_fill,
          ROUND(AVG(CASE WHEN weekday = 'Thu' THEN fill_pct END), 1) AS thursday_fill,
          ROUND(AVG(CASE WHEN weekday = 'Thu' THEN fill_pct END) - AVG(CASE WHEN weekday = 'Fri' THEN fill_pct END), 1) AS gap_points,
          ROUND(100 - AVG(CASE WHEN weekday = 'Fri' THEN showup_pct END), 1) AS friday_no_show,
          ROUND(AVG(CASE WHEN weekday = 'Fri' THEN avg_rating END), 1) AS friday_rating
        FROM events
        WHERE club_id = 'C01'
      `),

      slotPerformance: sql(`
        SELECT weekday || ' ' || start_time AS slot, COUNT(*) AS event_count,
          ROUND(AVG(fill_pct), 1) AS avg_fill,
          ROUND(AVG(showup_pct), 1) AS avg_showup,
          ROUND(AVG(avg_rating), 1) AS avg_rating
        FROM events
        WHERE club_id = 'C01'
        GROUP BY weekday, start_time
        ORDER BY avg_fill DESC
      `),

      weeklyEvidence: sql(`
        SELECT 'Wk ' || week AS week_label, week,
          ROUND(AVG(CASE WHEN weekday <> 'Fri' THEN fill_pct END), 1) AS midweek_fill,
          ROUND(AVG(CASE WHEN weekday = 'Fri' THEN fill_pct END), 1) AS friday_fill
        FROM events
        WHERE club_id = 'C01' AND week >= 5
        GROUP BY week
        ORDER BY week
      `),

      topicPerformance: sql(`
        SELECT topic, COUNT(*) AS event_count,
          ROUND(AVG(fill_pct), 1) AS avg_fill,
          ROUND(AVG(avg_rating), 1) AS avg_rating
        FROM events
        WHERE club_id = 'C01'
        GROUP BY topic
        ORDER BY avg_fill DESC
      `),

      hypothesisChecks: sql(`
        SELECT 'H1 · Topics' AS hypothesis, 'Workshop rating: 4.50 Fri vs 4.48 midweek' AS evidence,
          'Not supported' AS verdict, 'Success' AS state, 1 AS sort_order
        UNION ALL
        SELECT 'H2 · Promotion', 'Week 5 reach: 746 Fri vs 741 Wed; fill halves',
          'Not supported', 'Success', 2
        UNION ALL
        SELECT 'H3 · Timing', 'Friday fill: 39.5% vs 81.2% midweek',
          'Root cause', 'Error', 3
        ORDER BY sort_order
      `),

      promotionPair: sql(`
        SELECT e.title, e.weekday, e.start_time, e.fill_pct,
          COUNT(p.post_id) AS posts, SUM(p.reach) AS reach
        FROM events e
        JOIN promotion_posts p ON p.event_id = e.event_id
        WHERE e.club_id = 'C01' AND e.week = 5
        GROUP BY e.event_id
        ORDER BY e.weekday
      `),

      actionPlan: sql.one(`
        SELECT 'M105' AS room, 'Tue' AS weekday, '18:00' AS start_time,
          CASE WHEN EXISTS (
            SELECT 1 FROM room_bookings WHERE room = 'M105' AND weekday = 'Tue'
          ) THEN 'Check conflict' ELSE 'Available' END AS availability
      `),

      nextSemesterBookings: sql(`
        SELECT CASE weekday WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3 WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 END AS day_order,
          weekday, start_time || '–' || end_time AS time_range, booked_by,
          'Booked' AS status, 'Warning' AS state
        FROM room_bookings
        WHERE room = 'M105'
        UNION ALL
        SELECT 2, 'Tue', '18:00–20:00', 'Recommended Coding Club slot', 'Available', 'Success'
        ORDER BY day_order
      `),

      // 🧩 YOUR QUERIES END
    };
  };
});
