import moment from "moment-timezone";
import { DateRangePicker as DateRange } from "rsuite";

type params = {
  onDatePeriodSelection?: any;
  disabled?: boolean;
  startDate?: any;
  endDate?: any;
};

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;


// Assuming you have the timeZone variable set up
const predefinedRanges = [
  {
    label: "Today",
    value: [
      new Date(moment.tz(timeZone).startOf("day").format("YYYY-MM-DD")),
      new Date(moment.tz(timeZone).endOf("day").format("YYYY-MM-DD")),
    ],
    placement: "left",
  },
  {
    label: "Yesterday",
    value: [
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "days")
          .startOf("day")
          .format("YYYY-MM-DD")
      ),
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "days")
          .endOf("day")
          .format("YYYY-MM-DD")
      ),
    ],
    placement: "left",
  },
  {
    label: "This Week",
    value: [
      new Date(moment.tz(timeZone).startOf("week").format("YYYY-MM-DD")),
      new Date(moment.tz(timeZone).endOf("week").format("YYYY-MM-DD")),
    ],
    placement: "left",
  },
  {
    label: "Last Week",
    value: [
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "week")
          .startOf("week")
          .format("YYYY-MM-DD")
      ),
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "week")
          .endOf("week")
          .format("YYYY-MM-DD")
      ),
    ],
    placement: "left",
  },
  {
    label: "This Month",
    value: [
      new Date(moment.tz(timeZone).startOf("month").format("YYYY-MM-DD")),
      new Date(moment.tz(timeZone).endOf("month").format("YYYY-MM-DD")),
    ],
    placement: "left",
  },
  {
    label: "Last Month",
    value: [
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD")
      ),
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD")
      ),
    ],
    placement: "left",
  },
  {
    label: "This Quarter",
    value: [
      new Date(moment.tz(timeZone).startOf("quarter").format("YYYY-MM-DD")),
      new Date(moment.tz(timeZone).endOf("quarter").format("YYYY-MM-DD")),
    ],
    placement: "left",
  },
  {
    label: "Last Quarter",
    value: [
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "quarter")
          .startOf("quarter")
          .format("YYYY-MM-DD")
      ),
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "quarter")
          .endOf("quarter")
          .format("YYYY-MM-DD")
      ),
    ],
    placement: "left",
  },
  {
    label: "This Year",
    value: [
      new Date(moment.tz(timeZone).startOf("year").format("YYYY-MM-DD")),
      new Date(moment.tz(timeZone).endOf("year").format("YYYY-MM-DD")),
    ],
    placement: "left",
  },
  {
    label: "Last Year",
    value: [
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "year")
          .startOf("year")
          .format("YYYY-MM-DD")
      ),
      new Date(
        moment
          .tz(timeZone)
          .subtract(1, "year")
          .endOf("year")
          .format("YYYY-MM-DD")
      ),
    ],
    placement: "left",
  },
];

export default predefinedRanges;

export const DateRangePicker = (props: params) => {
  const { onDatePeriodSelection, disabled, startDate, endDate, ...others } =
    props;

  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <DateRange
      ranges={predefinedRanges as any}
      placeholder="Select Time Period"
      placement="auto"
      disabled={disabled}
      defaultValue={[new Date(), new Date()]}
      onChange={(e:any) => onDatePeriodSelection(e)}
      style={{ width: "100%", zIndex: 1200 }}
    />
  );
};
