import sys
import json
from datetime import datetime
from meteostat import Point, Daily


def main():
    lat = float(sys.argv[1]) if len(sys.argv) > 1 else 37.5665
    lon = float(sys.argv[2]) if len(sys.argv) > 2 else 126.9780
    start_str = sys.argv[3] if len(sys.argv) > 3 else "2024-01-01"
    end_str = sys.argv[4] if len(sys.argv) > 4 else "2024-03-31"

    start = datetime.strptime(start_str, "%Y-%m-%d")
    end = datetime.strptime(end_str, "%Y-%m-%d")

    location = Point(lat, lon)
    data = Daily(location, start=start, end=end)
    df = data.fetch()

    out = df[["tavg", "tmin", "tmax", "prcp"]].reset_index()
    out["time"] = out["time"].dt.strftime("%Y-%m-%d")
    print(out.to_json(orient="records"))


if __name__ == "__main__":
    main()
