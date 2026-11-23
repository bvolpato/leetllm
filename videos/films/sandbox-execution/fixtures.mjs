export const REPORT_XML = `<testsuite xmlns="urn:junit">
  <testcase classname="ReportParser" name="rejectsFailure"><failure/></testcase>
  <testcase classname="ReportParser" name="rejectsFailure"><failure/></testcase>
  <testcase classname="ReportParser" name="handlesError"><error/></testcase>
  <testcase classname="ReportParser" name="skipsSlowCase"><skipped/></testcase>
</testsuite>`;
export const WASM_FUEL_CUES = Object.freeze({
  beatSpan: 11.718,
  consumeStart: 2.5125,
  exhaustion: 4.675,
});
export const FRESH_REPORT_XML = `<testsuite xmlns="urn:fresh">
 <testcase classname="payments" name="retry"><failure/><error/></testcase>
 <testcase classname="payments" name="later"><skipped/><error/></testcase>
 <testcase classname="payments" name="nested"><details><failure/></details></testcase>
 <testcase classname="payments" name="retry"><failure/></testcase>
</testsuite>`;
