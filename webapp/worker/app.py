import sys
import shutil
import os
import zipfile


if __name__ == "__main__":
    # Get request info
    temp_file = sys.argv[1]
    student_id = sys.argv[2]

    # Create /out folder if not exists
    if not os.path.exists("../data/out"):
        os.mkdir("../data/out", 0o777)

    # Create /tmp folder if not exists
    if not os.path.exists("../data/tmp"):
        os.mkdir("../data/tmp", 0o777)

    # Create /out/unzipped folder if not exists
    if not os.path.exists("../data/out/unzipped"):
        os.mkdir("../data/out/unzipped", 0o777)

    # If template hasn't been unzipped before, unzip it
    if not os.path.exists("../data/out/unzipped/{}_template".format(temp_file)):
        with zipfile.ZipFile(
            "../data/templates/{}_template.xlsm".format(temp_file), "r"
        ) as zip_ref:
            zip_ref.extractall("../data/out/unzipped/{}_template".format(temp_file))

    # Create temporary directory for new file
    shutil.copytree(
        "../data/out/unzipped/{}_template".format(temp_file),
        "../data/tmp/{}".format(student_id),
    )

    # Change Student ID
    with open("../data/tmp/{}/xl/sharedStrings.xml".format(student_id), "r") as fp:
        raw = fp.read()
        raw = raw.replace("S000001", student_id)

    with open("../data/tmp/{}/xl/sharedStrings.xml".format(student_id), "w") as fp:
        fp.write(raw)

    # Comprsess the folder and place it in /out
    with zipfile.ZipFile(
        "../data/out/{}_{}.xlsm".format(student_id, temp_file),
        "w",
        zipfile.ZIP_DEFLATED,
    ) as zipobj:
        rootlen = len("../data/tmp/{}".format(student_id)) + 1
        for base, _, files in os.walk("../data/tmp/{}".format(student_id)):
            for file in files:
                fn = os.path.join(base, file)
                zipobj.write(fn, fn[rootlen:])

    # Remove temporary directory
    shutil.rmtree("../data/tmp/{}".format(student_id))